using System.Diagnostics;
using System.Text.RegularExpressions;
using HMS.Application.DTOs.Backup;
using HMS.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace HMS.Infrastructure.Services;

public class BackupService : IBackupService
{
    private readonly string _connectionString;
    private readonly string _containerName;
    private readonly string _hostBackupDirectory;
    private readonly string _containerBackupDirectory;
    private readonly string _databaseName;
    private readonly string _dbUser;
    private readonly string _dbPassword;
    private readonly ILogger<BackupService> _logger;

    // Only allow simple, extension-locked file names to prevent path traversal
    // or argument injection into the docker CLI / pg_dump commands.
    private static readonly Regex SafeFileNameRegex = new(@"^[A-Za-z0-9_\-]+\.dump$", RegexOptions.Compiled);

    public BackupService(IConfiguration configuration, ILogger<BackupService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        _containerName = configuration["Backup:ContainerName"]
            ?? throw new InvalidOperationException("Backup:ContainerName is not configured.");
        _hostBackupDirectory = configuration["Backup:HostBackupDirectory"]
            ?? throw new InvalidOperationException("Backup:HostBackupDirectory is not configured.");
        _containerBackupDirectory = configuration["Backup:ContainerBackupDirectory"]
            ?? throw new InvalidOperationException("Backup:ContainerBackupDirectory is not configured.");
        _databaseName = configuration["Backup:DatabaseName"] ?? "HmsDb";
        _logger = logger;

        var connBuilder = new NpgsqlConnectionStringBuilder(_connectionString);
        _dbUser = connBuilder.Username ?? "postgres";
        _dbPassword = connBuilder.Password ?? string.Empty;

        Directory.CreateDirectory(_hostBackupDirectory);
    }

    public async Task<BackupFileDto> CreateBackupAsync()
    {
        var fileName = $"{_databaseName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.dump";
        var containerFilePath = $"{_containerBackupDirectory}/{fileName}";
        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);

        RunDockerCommand(
            "exec", "-e", $"PGPASSWORD={_dbPassword}", _containerName,
            "pg_dump", "-h", "127.0.0.1", "-U", _dbUser, "-F", "c", "-f", containerFilePath, _databaseName);

        RunDockerCommand("cp", $"{_containerName}:{containerFilePath}", hostFilePath);
        RunDockerCommand("exec", _containerName, "rm", "-f", containerFilePath);

        var info = new FileInfo(hostFilePath);
        if (!info.Exists)
        {
            throw new InvalidOperationException("Backup file was not found on host after docker cp.");
        }

        return new BackupFileDto { FileName = fileName, SizeBytes = info.Length, CreatedAtUtc = info.CreationTimeUtc };
    }

    public Task<IEnumerable<BackupFileDto>> ListBackupsAsync()
    {
        Directory.CreateDirectory(_hostBackupDirectory);

        var files = Directory.GetFiles(_hostBackupDirectory, "*.dump")
            .Select(f => new FileInfo(f))
            .OrderByDescending(f => f.CreationTimeUtc)
            .Select(f => new BackupFileDto { FileName = f.Name, SizeBytes = f.Length, CreatedAtUtc = f.CreationTimeUtc })
            .ToList();

        return Task.FromResult<IEnumerable<BackupFileDto>>(files);
    }

    public Task<(byte[] Content, string FileName)> DownloadBackupAsync(string fileName)
    {
        ValidateFileName(fileName);
        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);
        if (!File.Exists(hostFilePath))
        {
            throw new KeyNotFoundException($"Backup file '{fileName}' not found.");
        }

        var bytes = File.ReadAllBytes(hostFilePath);
        return Task.FromResult((bytes, fileName));
    }

    public async Task RestoreBackupAsync(Stream fileContent, string fileName)
    {
        ValidateFileName(fileName);

        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);
        await using (var fs = new FileStream(hostFilePath, FileMode.Create, FileAccess.Write))
        {
            await fileContent.CopyToAsync(fs);
        }

        var containerFilePath = $"{_containerBackupDirectory}/{fileName}";
        RunDockerCommand("cp", hostFilePath, $"{_containerName}:{containerFilePath}");

        await TerminateActiveConnectionsAsync();

        try
        {
            RunDockerCommand(
                "exec", "-e", $"PGPASSWORD={_dbPassword}", _containerName,
                "pg_restore", "-h", "127.0.0.1", "-U", _dbUser, "-d", _databaseName,
                "--clean", "--if-exists", containerFilePath);
        }
        finally
        {
            RunDockerCommand("exec", _containerName, "rm", "-f", containerFilePath);
        }

        NpgsqlConnection.ClearAllPools();
    }

    public Task DeleteBackupAsync(string fileName)
    {
        ValidateFileName(fileName);
        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);
        if (!File.Exists(hostFilePath))
        {
            throw new KeyNotFoundException($"Backup file '{fileName}' not found.");
        }

        File.Delete(hostFilePath);
        return Task.CompletedTask;
    }

    private static void ValidateFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || !SafeFileNameRegex.IsMatch(fileName))
        {
            throw new ArgumentException("Invalid backup file name.");
        }
    }

    private async Task TerminateActiveConnectionsAsync()
    {
        var builder = new NpgsqlConnectionStringBuilder(_connectionString) { Database = "postgres" };
        await using var connection = new NpgsqlConnection(builder.ConnectionString);
        await connection.OpenAsync();

        const string sql = @"
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = @dbName AND pid <> pg_backend_pid();";

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("dbName", _databaseName);
        await command.ExecuteNonQueryAsync();
    }

    private void RunDockerCommand(params string[] arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "docker",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var arg in arguments)
        {
            psi.ArgumentList.Add(arg);
        }

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException("Failed to start docker process.");

        var stderr = process.StandardError.ReadToEnd();
        process.StandardOutput.ReadToEnd();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            var safeArgs = string.Join(' ', arguments.Select(a => a.StartsWith("PGPASSWORD=") ? "PGPASSWORD=***" : a));
            _logger.LogError("docker {Args} failed with exit code {Code}. stderr: {StdErr}",
                safeArgs, process.ExitCode, stderr);
            throw new InvalidOperationException($"Docker command failed: docker {safeArgs}. {stderr}");
        }
    }
}

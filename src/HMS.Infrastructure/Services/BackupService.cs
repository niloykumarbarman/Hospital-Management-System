using System.Diagnostics;
using System.Text.RegularExpressions;
using HMS.Application.DTOs.Backup;
using HMS.Application.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HMS.Infrastructure.Services;

public class BackupService : IBackupService
{
    private readonly string _connectionString;
    private readonly string _containerName;
    private readonly string _hostBackupDirectory;
    private readonly string _containerBackupDirectory;
    private readonly string _databaseName;
    private readonly ILogger<BackupService> _logger;

    // Only allow simple, extension-locked file names to prevent path traversal
    // or argument injection into the docker CLI / SQL commands.
    private static readonly Regex SafeFileNameRegex = new(@"^[A-Za-z0-9_\-]+\.bak$", RegexOptions.Compiled);

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

        Directory.CreateDirectory(_hostBackupDirectory);
    }

    public async Task<BackupFileDto> CreateBackupAsync()
    {
        var fileName = $"{_databaseName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.bak";
        var containerFilePath = $"{_containerBackupDirectory}/{fileName}";
        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);

        await using (var connection = new SqlConnection(BuildMasterConnectionString()))
        {
            await connection.OpenAsync();
            var sql = $"BACKUP DATABASE [{_databaseName}] TO DISK = @path WITH INIT, FORMAT";
            await using var command = new SqlCommand(sql, connection) { CommandTimeout = 120 };
            command.Parameters.AddWithValue("@path", containerFilePath);
            await command.ExecuteNonQueryAsync();
        }

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

        var files = Directory.GetFiles(_hostBackupDirectory, "*.bak")
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

        await using (var connection = new SqlConnection(BuildMasterConnectionString()))
        {
            await connection.OpenAsync();

            // Kick out any active connections (including EF Core's pooled ones) before restoring
            await ExecuteNonQueryAsync(connection, $"ALTER DATABASE [{_databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE");

            try
            {
                var restoreSql = $"RESTORE DATABASE [{_databaseName}] FROM DISK = @path WITH REPLACE";
                await using var restoreCmd = new SqlCommand(restoreSql, connection) { CommandTimeout = 120 };
                restoreCmd.Parameters.AddWithValue("@path", containerFilePath);
                await restoreCmd.ExecuteNonQueryAsync();
            }
            finally
            {
                await ExecuteNonQueryAsync(connection, $"ALTER DATABASE [{_databaseName}] SET MULTI_USER");
            }
        }

        RunDockerCommand("exec", _containerName, "rm", "-f", containerFilePath);

        // Force ADO.NET/EF Core to drop pooled connections opened before the restore
        SqlConnection.ClearAllPools();
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

    private string BuildMasterConnectionString()
    {
        var builder = new SqlConnectionStringBuilder(_connectionString) { InitialCatalog = "master" };
        return builder.ConnectionString;
    }

    private static async Task ExecuteNonQueryAsync(SqlConnection connection, string sql)
    {
        await using var command = new SqlCommand(sql, connection) { CommandTimeout = 60 };
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
            _logger.LogError("docker {Args} failed with exit code {Code}. stderr: {StdErr}",
                string.Join(' ', arguments), process.ExitCode, stderr);
            throw new InvalidOperationException($"Docker command failed: docker {string.Join(' ', arguments)}. {stderr}");
        }
    }
}

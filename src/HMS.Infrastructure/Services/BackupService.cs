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
    private readonly string _hostBackupDirectory;
    private readonly string _databaseName;
    private readonly string _dbHost;
    private readonly int _dbPort;
    private readonly string _dbUser;
    private readonly string _dbPassword;
    private readonly ILogger<BackupService> _logger;

    // Only allow simple, extension-locked file names to prevent path traversal
    // or argument injection into the pg_dump/pg_restore commands.
    private static readonly Regex SafeFileNameRegex = new(@"^[A-Za-z0-9_\-]+\.dump$", RegexOptions.Compiled);

    public BackupService(IConfiguration configuration, ILogger<BackupService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        _hostBackupDirectory = configuration["Backup:HostBackupDirectory"]
            ?? throw new InvalidOperationException("Backup:HostBackupDirectory is not configured.");
        _logger = logger;

        var connBuilder = new NpgsqlConnectionStringBuilder(_connectionString);
        _dbHost = connBuilder.Host ?? "localhost";
        _dbPort = connBuilder.Port != 0 ? connBuilder.Port : 5432;
        // The connection string is the single source of truth for which database to back up.
        // Backup:DatabaseName is only an optional override; previously it silently defaulted
        // to "HmsDb" even when the connection string pointed at a differently-named database
        // (e.g. Render's managed Postgres), which made pg_dump fail with "database does not exist".
        _databaseName = configuration["Backup:DatabaseName"]
            ?? connBuilder.Database
            ?? throw new InvalidOperationException("Could not determine the database name from DefaultConnection.");
        _dbUser = connBuilder.Username ?? "postgres";
        _dbPassword = connBuilder.Password ?? string.Empty;

        Directory.CreateDirectory(_hostBackupDirectory);
    }

    public Task<BackupFileDto> CreateBackupAsync()
    {
        var fileName = $"{_databaseName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.dump";
        var hostFilePath = Path.Combine(_hostBackupDirectory, fileName);

        RunPgCommand("pg_dump",
            "-h", _dbHost, "-p", _dbPort.ToString(), "-U", _dbUser,
            "-F", "c", "-f", hostFilePath, _databaseName);

        var info = new FileInfo(hostFilePath);
        if (!info.Exists)
        {
            throw new InvalidOperationException("Backup file was not created by pg_dump.");
        }

        return Task.FromResult(new BackupFileDto { FileName = fileName, SizeBytes = info.Length, CreatedAtUtc = info.CreationTimeUtc });
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

        await TerminateActiveConnectionsAsync();

        RunPgCommand("pg_restore",
            "-h", _dbHost, "-p", _dbPort.ToString(), "-U", _dbUser, "-d", _databaseName,
            "--clean", "--if-exists", hostFilePath);

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

    private void RunPgCommand(string fileName, params string[] arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi.Environment["PGPASSWORD"] = _dbPassword;

        foreach (var arg in arguments)
        {
            psi.ArgumentList.Add(arg);
        }

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException($"Failed to start {fileName} process.");

        var stderr = process.StandardError.ReadToEnd();
        process.StandardOutput.ReadToEnd();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            _logger.LogError("{Cmd} failed with exit code {Code}. stderr: {StdErr}", fileName, process.ExitCode, stderr);
            throw new InvalidOperationException($"{fileName} command failed. {stderr}");
        }
    }
}

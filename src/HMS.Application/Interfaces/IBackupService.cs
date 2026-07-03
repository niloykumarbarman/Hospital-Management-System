using HMS.Application.DTOs.Backup;

namespace HMS.Application.Interfaces;

// Handles database backup/restore. Since the SQL Server engine runs inside a Docker
// container with no host-mounted volume, backup files are copied out to (and restored
// from) the host filesystem using the docker CLI (docker cp), invoked as a child process.
public interface IBackupService
{
    Task<BackupFileDto> CreateBackupAsync();
    Task<IEnumerable<BackupFileDto>> ListBackupsAsync();
    Task<(byte[] Content, string FileName)> DownloadBackupAsync(string fileName);
    Task RestoreBackupAsync(Stream fileContent, string fileName);
    Task DeleteBackupAsync(string fileName);
}

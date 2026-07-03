namespace HMS.Application.DTOs.Backup;

// Metadata for a single .bak file stored on the host machine's backup directory
public class BackupFileDto
{
    public string FileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

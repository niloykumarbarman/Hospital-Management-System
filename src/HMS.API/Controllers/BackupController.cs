using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly IBackupService _backupService;

    public BackupController(IBackupService backupService)
    {
        _backupService = backupService;
    }

    // POST: api/Backup
    [HttpPost]
    public async Task<IActionResult> CreateBackup()
    {
        var result = await _backupService.CreateBackupAsync();
        return Ok(result);
    }

    // GET: api/Backup
    [HttpGet]
    public async Task<IActionResult> ListBackups()
    {
        var result = await _backupService.ListBackupsAsync();
        return Ok(result);
    }

    // GET: api/Backup/{fileName}/download
    [HttpGet("{fileName}/download")]
    public async Task<IActionResult> DownloadBackup(string fileName)
    {
        var (content, name) = await _backupService.DownloadBackupAsync(fileName);
        return File(content, "application/octet-stream", name);
    }

    // POST: api/Backup/restore (multipart/form-data, field name: file)
    [HttpPost("restore")]
    [RequestSizeLimit(2_147_483_648)] // 2GB cap for large backup uploads
    public async Task<IActionResult> RestoreBackup(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No backup file was uploaded.");
        }

        await using var stream = file.OpenReadStream();
        await _backupService.RestoreBackupAsync(stream, file.FileName);
        return Ok(new { message = "Database restored successfully." });
    }

    // DELETE: api/Backup/{fileName}
    [HttpDelete("{fileName}")]
    public async Task<IActionResult> DeleteBackup(string fileName)
    {
        await _backupService.DeleteBackupAsync(fileName);
        return NoContent();
    }
}

namespace HMS.Application.DTOs.User;

// DTO returned to client when listing users (e.g. to populate the Doctor-creation dropdown)
public class UserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool HasDoctorProfile { get; set; }
}

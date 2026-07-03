using HMS.Domain.Enums;

namespace HMS.Application.DTOs.Patient;

// DTO used when creating a new patient (PatientCode is auto-generated in the service)
public class CreatePatientDto
{
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
}

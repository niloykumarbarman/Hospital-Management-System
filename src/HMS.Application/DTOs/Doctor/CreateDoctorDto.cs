namespace HMS.Application.DTOs.Doctor;

// DTO used when creating a doctor profile for an existing User (Role = Doctor)
public class CreateDoctorDto
{
    public Guid UserId { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public decimal ConsultationFee { get; set; }
    public int ExperienceYears { get; set; }
}

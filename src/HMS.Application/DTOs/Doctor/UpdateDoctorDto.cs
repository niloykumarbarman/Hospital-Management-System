namespace HMS.Application.DTOs.Doctor;

// DTO used when updating an existing doctor profile
public class UpdateDoctorDto
{
    public string Specialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public decimal ConsultationFee { get; set; }
    public int ExperienceYears { get; set; }
}

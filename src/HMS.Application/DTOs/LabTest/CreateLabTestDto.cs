namespace HMS.Application.DTOs.LabTest;

// DTO used when creating a new lab test request
public class CreateLabTestDto
{
    public Guid PatientId { get; set; }
    public Guid? MedicalRecordId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string? TestType { get; set; }
    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
}

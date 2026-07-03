namespace HMS.Application.DTOs.LabTest;

// DTO returned to client when reading a lab test (flattens Patient name)
public class LabTestDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? MedicalRecordId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string? TestType { get; set; }
    public DateTime RequestedDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultValue { get; set; }
    public string? NormalRange { get; set; }
    public string? Remarks { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

namespace HMS.Application.DTOs.LabTest;

// DTO used when updating a lab test (e.g. adding result after test is done)
public class UpdateLabTestDto
{
    public string TestName { get; set; } = string.Empty;
    public string? TestType { get; set; }
    public DateTime RequestedDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultValue { get; set; }
    public string? NormalRange { get; set; }
    public string? Remarks { get; set; }
    public bool IsCompleted { get; set; }
}

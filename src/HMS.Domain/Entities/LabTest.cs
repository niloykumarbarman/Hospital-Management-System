using HMS.Domain.Common;

namespace HMS.Domain.Entities;

public class LabTest : BaseEntity
{
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? MedicalRecordId { get; set; }
    public MedicalRecord? MedicalRecord { get; set; }

    public string TestName { get; set; } = string.Empty;
    public string? TestType { get; set; }
    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ResultDate { get; set; }
    public string? ResultValue { get; set; }
    public string? NormalRange { get; set; }
    public string? Remarks { get; set; }
    public bool IsCompleted { get; set; } = false;
}

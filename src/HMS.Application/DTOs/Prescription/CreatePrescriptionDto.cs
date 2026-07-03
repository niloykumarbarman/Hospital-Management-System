namespace HMS.Application.DTOs.Prescription;

// DTO used when creating a new prescription with one or more medicine items
public class CreatePrescriptionDto
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? MedicalRecordId { get; set; }
    public DateTime PrescriptionDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();
}

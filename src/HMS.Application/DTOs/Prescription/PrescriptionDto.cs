namespace HMS.Application.DTOs.Prescription;

// DTO returned to client when reading a prescription (flattens Patient/Doctor names, includes items)
public class PrescriptionDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public Guid? MedicalRecordId { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string? Notes { get; set; }
    public List<PrescriptionItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

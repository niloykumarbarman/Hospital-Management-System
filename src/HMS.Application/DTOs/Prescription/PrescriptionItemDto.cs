namespace HMS.Application.DTOs.Prescription;

// DTO returned to client for a single prescription item (flattens Medicine name)
public class PrescriptionItemDto
{
    public Guid Id { get; set; }
    public Guid MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationInDays { get; set; }
    public string? Instructions { get; set; }
}

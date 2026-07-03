namespace HMS.Application.DTOs.Prescription;

// DTO for a single medicine line item within a prescription
public class CreatePrescriptionItemDto
{
    public Guid MedicineId { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationInDays { get; set; }
    public string? Instructions { get; set; }
}

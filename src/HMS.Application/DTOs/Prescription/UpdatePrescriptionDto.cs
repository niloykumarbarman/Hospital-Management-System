namespace HMS.Application.DTOs.Prescription;

// DTO used when updating a prescription. Patient/Doctor/MedicalRecord are immutable after creation;
// Items are fully replaced (old items removed, new items added) on update.
public class UpdatePrescriptionDto
{
    public DateTime PrescriptionDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePrescriptionItemDto> Items { get; set; } = new();
}

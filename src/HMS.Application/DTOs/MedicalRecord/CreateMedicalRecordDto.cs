using HMS.Domain.Enums;

namespace HMS.Application.DTOs.MedicalRecord;

// DTO used when creating a new medical record entry
public class CreateMedicalRecordDto
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public AdmissionType AdmissionType { get; set; }
    public DateTime VisitDate { get; set; } = DateTime.UtcNow;
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? VitalSigns { get; set; }
    public string? Notes { get; set; }
}

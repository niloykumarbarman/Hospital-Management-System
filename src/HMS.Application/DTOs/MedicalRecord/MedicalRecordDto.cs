using HMS.Domain.Enums;

namespace HMS.Application.DTOs.MedicalRecord;

// DTO returned to client when reading a medical record (flattens Patient and Doctor names)
public class MedicalRecordDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public AdmissionType AdmissionType { get; set; }
    public DateTime VisitDate { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? VitalSigns { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

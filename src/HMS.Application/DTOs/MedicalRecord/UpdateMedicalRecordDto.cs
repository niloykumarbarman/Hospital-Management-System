using HMS.Domain.Enums;
namespace HMS.Application.DTOs.MedicalRecord;
// DTO used when updating an existing medical record (e.g. adding diagnosis after visit)
public class UpdateMedicalRecordDto
{
    public AdmissionType AdmissionType { get; set; }
    public DateTime VisitDate { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? VitalSigns { get; set; }
    public string? Notes { get; set; }
}

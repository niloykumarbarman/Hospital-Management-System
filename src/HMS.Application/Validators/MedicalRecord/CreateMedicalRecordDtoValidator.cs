using FluentValidation;
using HMS.Application.DTOs.MedicalRecord;

namespace HMS.Application.Validators.MedicalRecord;

public class CreateMedicalRecordDtoValidator : AbstractValidator<CreateMedicalRecordDto>
{
    public CreateMedicalRecordDtoValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("PatientId is required.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("DoctorId is required.");

        RuleFor(x => x.AdmissionType)
            .IsInEnum().WithMessage("Invalid admission type.");

        RuleFor(x => x.VisitDate)
            .NotEmpty().WithMessage("Visit date is required.");

        RuleFor(x => x.ChiefComplaint)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.ChiefComplaint));

        RuleFor(x => x.Diagnosis)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Diagnosis));

        RuleFor(x => x.TreatmentPlan)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.TreatmentPlan));

        RuleFor(x => x.VitalSigns)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.VitalSigns));

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

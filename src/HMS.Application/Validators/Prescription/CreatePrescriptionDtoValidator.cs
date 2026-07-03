using FluentValidation;
using HMS.Application.DTOs.Prescription;

namespace HMS.Application.Validators.Prescription;

public class CreatePrescriptionDtoValidator : AbstractValidator<CreatePrescriptionDto>
{
    public CreatePrescriptionDtoValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("PatientId is required.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("DoctorId is required.");

        RuleFor(x => x.PrescriptionDate)
            .NotEmpty().WithMessage("Prescription date is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one prescription item is required.");

        RuleForEach(x => x.Items)
            .SetValidator(new CreatePrescriptionItemDtoValidator());
    }
}

using FluentValidation;
using HMS.Application.DTOs.Prescription;

namespace HMS.Application.Validators.Prescription;

public class CreatePrescriptionItemDtoValidator : AbstractValidator<CreatePrescriptionItemDto>
{
    public CreatePrescriptionItemDtoValidator()
    {
        RuleFor(x => x.MedicineId)
            .NotEmpty().WithMessage("MedicineId is required.");

        RuleFor(x => x.Dosage)
            .NotEmpty().WithMessage("Dosage is required.")
            .MaximumLength(200);

        RuleFor(x => x.Frequency)
            .NotEmpty().WithMessage("Frequency is required.")
            .MaximumLength(200);

        RuleFor(x => x.DurationInDays)
            .GreaterThan(0).WithMessage("Duration must be at least 1 day.");

        RuleFor(x => x.Instructions)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.Instructions));
    }
}

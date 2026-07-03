using FluentValidation;
using HMS.Application.DTOs.LabTest;

namespace HMS.Application.Validators.LabTest;

public class CreateLabTestDtoValidator : AbstractValidator<CreateLabTestDto>
{
    public CreateLabTestDtoValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("PatientId is required.");

        RuleFor(x => x.TestName)
            .NotEmpty().WithMessage("Test name is required.")
            .MaximumLength(200);

        RuleFor(x => x.TestType)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.TestType));

        RuleFor(x => x.RequestedDate)
            .NotEmpty().WithMessage("Requested date is required.");
    }
}

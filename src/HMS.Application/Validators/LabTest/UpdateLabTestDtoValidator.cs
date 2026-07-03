using FluentValidation;
using HMS.Application.DTOs.LabTest;

namespace HMS.Application.Validators.LabTest;

public class UpdateLabTestDtoValidator : AbstractValidator<UpdateLabTestDto>
{
    public UpdateLabTestDtoValidator()
    {
        RuleFor(x => x.TestName)
            .NotEmpty().WithMessage("Test name is required.")
            .MaximumLength(200);

        RuleFor(x => x.TestType)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.TestType));

        RuleFor(x => x.RequestedDate)
            .NotEmpty().WithMessage("Requested date is required.");

        RuleFor(x => x.ResultValue)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.ResultValue));

        RuleFor(x => x.NormalRange)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.NormalRange));

        RuleFor(x => x.Remarks)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Remarks));
    }
}

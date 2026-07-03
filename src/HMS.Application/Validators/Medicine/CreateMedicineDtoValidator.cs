using FluentValidation;
using HMS.Application.DTOs.Medicine;
namespace HMS.Application.Validators.Medicine;
public class CreateMedicineDtoValidator : AbstractValidator<CreateMedicineDto>
{
    public CreateMedicineDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Medicine name is required.")
            .MaximumLength(200);
        RuleFor(x => x.GenericName)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.GenericName));
        RuleFor(x => x.Manufacturer)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Manufacturer));
        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Unit is required.")
            .MaximumLength(50);
        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative.");
        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative.");
        RuleFor(x => x.ReorderLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Reorder level cannot be negative.");
    }
}

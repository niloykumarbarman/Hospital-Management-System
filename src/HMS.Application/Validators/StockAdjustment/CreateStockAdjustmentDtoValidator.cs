using FluentValidation;
using HMS.Application.DTOs.StockAdjustment;
namespace HMS.Application.Validators.StockAdjustment;
public class CreateStockAdjustmentDtoValidator : AbstractValidator<CreateStockAdjustmentDto>
{
    public CreateStockAdjustmentDtoValidator()
    {
        RuleFor(x => x.MedicineId)
            .NotEmpty().WithMessage("MedicineId is required.");
        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Type must be either In or Out.");
        RuleFor(x => x.QuantityChanged)
            .GreaterThan(0).WithMessage("Quantity changed must be greater than zero.");
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.Reason));
    }
}

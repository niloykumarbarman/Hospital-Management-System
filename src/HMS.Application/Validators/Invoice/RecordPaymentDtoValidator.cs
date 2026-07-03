using FluentValidation;
using HMS.Application.DTOs.Invoice;
namespace HMS.Application.Validators.Invoice;
public class RecordPaymentDtoValidator : AbstractValidator<RecordPaymentDto>
{
    public RecordPaymentDtoValidator()
    {
        RuleFor(x => x.AmountPaid)
            .GreaterThan(0).WithMessage("Amount paid must be greater than zero.");
    }
}

using FluentValidation;
using HMS.Application.DTOs.Invoice;
namespace HMS.Application.Validators.Invoice;
public class CreateInvoiceDtoValidator : AbstractValidator<CreateInvoiceDto>
{
    public CreateInvoiceDtoValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("PatientId is required.");
        RuleFor(x => x.InvoiceDate)
            .NotEmpty().WithMessage("Invoice date is required.");
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Invoice must have at least one item.");
        RuleForEach(x => x.Items).SetValidator(new CreateInvoiceItemDtoValidator());
    }
}

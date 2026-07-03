namespace HMS.Application.DTOs.Invoice;
// DTO used to record a payment against an invoice.
// PaidAmount is ADDED to the invoice's existing PaidAmount (not a replacement),
// and PaymentStatus/DueAmount are recalculated server-side.
public class RecordPaymentDto
{
    public decimal AmountPaid { get; set; }
}

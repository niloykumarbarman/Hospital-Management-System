namespace HMS.Application.DTOs.Invoice;
// DTO for a single line item within an invoice (e.g. a consultation fee, medicine charge, lab test fee)
public class CreateInvoiceItemDto
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}

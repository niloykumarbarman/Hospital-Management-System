namespace HMS.Application.DTOs.Invoice;
// DTO used when creating a new invoice with one or more line items.
// TotalAmount/DueAmount are NOT here - they are calculated server-side from Items.
public class CreateInvoiceDto
{
    public Guid PatientId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

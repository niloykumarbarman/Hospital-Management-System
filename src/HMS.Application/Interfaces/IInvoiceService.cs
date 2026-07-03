using HMS.Application.DTOs.Invoice;
namespace HMS.Application.Interfaces;
public interface IInvoiceService
{
    Task<IEnumerable<InvoiceDto>> GetAllAsync();
    Task<InvoiceDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<InvoiceDto>> GetByPatientIdAsync(Guid patientId);
    Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto);
    Task<InvoiceDto> RecordPaymentAsync(Guid id, RecordPaymentDto dto);
    Task DeleteAsync(Guid id);
}

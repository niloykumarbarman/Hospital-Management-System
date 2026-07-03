using HMS.Domain.Entities;
namespace HMS.Domain.Interfaces;
// Invoice-specific repository to eager-load Patient and Items, and generate unique invoice numbers
public interface IInvoiceRepository : IGenericRepository<Invoice>
{
    Task<IEnumerable<Invoice>> GetAllWithDetailsAsync();
    Task<Invoice?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Invoice>> GetByPatientIdAsync(Guid patientId);
    // Counts ALL invoices ever created (including soft-deleted) to avoid InvoiceNumber collisions
    Task<int> GetTotalCreatedCountAsync();
}

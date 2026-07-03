using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace HMS.Infrastructure.Repositories;
public class InvoiceRepository : GenericRepository<Invoice>, IInvoiceRepository
{
    private readonly AppDbContext _context;
    public InvoiceRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }
    public async Task<IEnumerable<Invoice>> GetAllWithDetailsAsync()
    {
        return await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }
    public async Task<Invoice?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
    }
    public async Task<IEnumerable<Invoice>> GetByPatientIdAsync(Guid patientId)
    {
        return await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items)
            .Where(i => i.PatientId == patientId)
            .OrderByDescending(i => i.InvoiceDate)
            .ToListAsync();
    }
    public async Task<int> GetTotalCreatedCountAsync()
    {
        return await _context.Invoices.IgnoreQueryFilters().CountAsync();
    }
}

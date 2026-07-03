using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class LabTestRepository : GenericRepository<LabTest>, ILabTestRepository
{
    private readonly AppDbContext _context;

    public LabTestRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<LabTest>> GetAllWithDetailsAsync()
    {
        return await _context.LabTests
            .Include(l => l.Patient)
            .OrderByDescending(l => l.RequestedDate)
            .ToListAsync();
    }

    public async Task<LabTest?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.LabTests
            .Include(l => l.Patient)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IEnumerable<LabTest>> GetByPatientIdAsync(Guid patientId)
    {
        return await _context.LabTests
            .Include(l => l.Patient)
            .Where(l => l.PatientId == patientId)
            .OrderByDescending(l => l.RequestedDate)
            .ToListAsync();
    }
}

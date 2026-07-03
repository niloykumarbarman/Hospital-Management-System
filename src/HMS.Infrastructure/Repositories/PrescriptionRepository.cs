using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class PrescriptionRepository : GenericRepository<Prescription>, IPrescriptionRepository
{
    private readonly AppDbContext _context;

    public PrescriptionRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Prescription>> GetAllWithDetailsAsync()
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Items).ThenInclude(i => i.Medicine)
            .ToListAsync();
    }

    public async Task<Prescription?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Items).ThenInclude(i => i.Medicine)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
    public async Task<IEnumerable<Prescription>> GetByPatientIdAsync(Guid patientId)
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Include(p => p.Items).ThenInclude(i => i.Medicine)
            .Where(p => p.PatientId == patientId)
            .ToListAsync();
    }
}

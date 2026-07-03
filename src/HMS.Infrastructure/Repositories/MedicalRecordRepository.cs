using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class MedicalRecordRepository : GenericRepository<MedicalRecord>, IMedicalRecordRepository
{
    private readonly AppDbContext _context;

    public MedicalRecordRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MedicalRecord>> GetAllWithDetailsAsync()
    {
        return await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Doctor).ThenInclude(d => d.User)
            .OrderByDescending(m => m.VisitDate)
            .ToListAsync();
    }

    public async Task<MedicalRecord?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IEnumerable<MedicalRecord>> GetByPatientIdAsync(Guid patientId)
    {
        return await _context.MedicalRecords
            .Include(m => m.Patient)
            .Include(m => m.Doctor).ThenInclude(d => d.User)
            .Where(m => m.PatientId == patientId)
            .OrderByDescending(m => m.VisitDate)
            .ToListAsync();
    }
}

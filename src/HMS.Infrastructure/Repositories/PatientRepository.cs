using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class PatientRepository : GenericRepository<Patient>, IPatientRepository
{
    private readonly AppDbContext _context;

    public PatientRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<int> GetTotalCreatedCountAsync()
    {
        // IgnoreQueryFilters bypasses the soft-delete filter so deleted patients still count,
        // preventing PatientCode collisions like PT-00001 being reused.
        return await _context.Patients.IgnoreQueryFilters().CountAsync();
    }
}

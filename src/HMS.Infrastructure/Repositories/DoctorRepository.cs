using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class DoctorRepository : GenericRepository<Doctor>, IDoctorRepository
{
    private readonly AppDbContext _context;

    public DoctorRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Doctor>> GetAllWithUserAsync()
    {
        return await _context.Doctors
            .Include(d => d.User)
            .ToListAsync();
    }

    public async Task<Doctor?> GetByIdWithUserAsync(Guid id)
    {
        return await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id);
    }
}

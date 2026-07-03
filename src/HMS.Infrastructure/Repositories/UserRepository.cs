using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<User>> GetAllWithDoctorAsync()
    {
        return await _context.Users
            .Include(u => u.Doctor)
            .ToListAsync();
    }
}

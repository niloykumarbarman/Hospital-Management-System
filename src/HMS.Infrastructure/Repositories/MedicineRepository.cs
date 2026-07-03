using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class MedicineRepository : GenericRepository<Medicine>, IMedicineRepository
{
    private readonly AppDbContext _context;

    public MedicineRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Medicine>> GetLowStockAsync()
    {
        return await _context.Medicines
            .Where(m => m.StockQuantity <= m.ReorderLevel)
            .OrderBy(m => m.StockQuantity)
            .ToListAsync();
    }
}

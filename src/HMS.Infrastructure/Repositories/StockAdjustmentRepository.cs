using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class StockAdjustmentRepository : GenericRepository<StockAdjustment>, IStockAdjustmentRepository
{
    private readonly AppDbContext _context;

    public StockAdjustmentRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StockAdjustment>> GetByMedicineIdAsync(Guid medicineId)
    {
        return await _context.StockAdjustments
            .Include(s => s.Medicine)
            .Include(s => s.AdjustedByUser)
            .Where(s => s.MedicineId == medicineId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<StockAdjustment>> GetAllWithDetailsAsync()
    {
        return await _context.StockAdjustments
            .Include(s => s.Medicine)
            .Include(s => s.AdjustedByUser)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}

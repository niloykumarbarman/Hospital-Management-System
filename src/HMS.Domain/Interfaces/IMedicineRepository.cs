using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// Medicine-specific repository for low-stock queries
public interface IMedicineRepository : IGenericRepository<Medicine>
{
    Task<IEnumerable<Medicine>> GetLowStockAsync();
}

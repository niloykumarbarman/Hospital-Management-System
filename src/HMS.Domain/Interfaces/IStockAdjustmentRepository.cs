using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// StockAdjustment-specific repository to eager-load Medicine and User details
public interface IStockAdjustmentRepository : IGenericRepository<StockAdjustment>
{
    Task<IEnumerable<StockAdjustment>> GetByMedicineIdAsync(Guid medicineId);
    Task<IEnumerable<StockAdjustment>> GetAllWithDetailsAsync();
}

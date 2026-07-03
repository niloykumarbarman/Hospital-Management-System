using HMS.Application.DTOs.StockAdjustment;
namespace HMS.Application.Interfaces;
public interface IStockAdjustmentService
{
    Task<IEnumerable<StockAdjustmentDto>> GetAllAsync();
    Task<IEnumerable<StockAdjustmentDto>> GetByMedicineIdAsync(Guid medicineId);
    Task<StockAdjustmentDto> CreateAsync(CreateStockAdjustmentDto dto, Guid adjustedByUserId);
}

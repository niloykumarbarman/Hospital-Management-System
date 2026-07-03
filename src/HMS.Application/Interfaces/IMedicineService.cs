using HMS.Application.DTOs.Medicine;
namespace HMS.Application.Interfaces;
public interface IMedicineService
{
    Task<IEnumerable<MedicineDto>> GetAllAsync();
    Task<MedicineDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<MedicineDto>> GetLowStockAsync();
    Task<MedicineDto> CreateAsync(CreateMedicineDto dto);
    Task<MedicineDto> UpdateAsync(Guid id, UpdateMedicineDto dto);
    Task DeleteAsync(Guid id);
}

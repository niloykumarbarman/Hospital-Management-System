using AutoMapper;
using HMS.Application.DTOs.Medicine;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
namespace HMS.Application.Services;
public class MedicineService : IMedicineService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public MedicineService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<IEnumerable<MedicineDto>> GetAllAsync()
    {
        var medicines = await _unitOfWork.MedicineRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<MedicineDto>>(medicines);
    }
    public async Task<MedicineDto?> GetByIdAsync(Guid id)
    {
        var medicine = await _unitOfWork.MedicineRepository.GetByIdAsync(id);
        return medicine == null ? null : _mapper.Map<MedicineDto>(medicine);
    }
    public async Task<IEnumerable<MedicineDto>> GetLowStockAsync()
    {
        var medicines = await _unitOfWork.MedicineRepository.GetLowStockAsync();
        return _mapper.Map<IEnumerable<MedicineDto>>(medicines);
    }
    public async Task<MedicineDto> CreateAsync(CreateMedicineDto dto)
    {
        var medicine = _mapper.Map<Medicine>(dto);
        await _unitOfWork.MedicineRepository.AddAsync(medicine);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<MedicineDto>(medicine);
    }
    public async Task<MedicineDto> UpdateAsync(Guid id, UpdateMedicineDto dto)
    {
        var medicine = await _unitOfWork.MedicineRepository.GetByIdAsync(id);
        if (medicine == null)
        {
            throw new KeyNotFoundException("Medicine not found.");
        }
        medicine.Name = dto.Name;
        medicine.GenericName = dto.GenericName;
        medicine.Manufacturer = dto.Manufacturer;
        medicine.Unit = dto.Unit;
        medicine.UnitPrice = dto.UnitPrice;
        medicine.ReorderLevel = dto.ReorderLevel;
        medicine.ExpiryDate = dto.ExpiryDate;
        await _unitOfWork.MedicineRepository.UpdateAsync(medicine);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<MedicineDto>(medicine);
    }
    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.MedicineRepository.ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Medicine not found.");
        }
        await _unitOfWork.MedicineRepository.DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}

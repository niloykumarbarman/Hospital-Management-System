using AutoMapper;
using HMS.Application.DTOs.StockAdjustment;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
namespace HMS.Application.Services;
public class StockAdjustmentService : IStockAdjustmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public StockAdjustmentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<IEnumerable<StockAdjustmentDto>> GetAllAsync()
    {
        var adjustments = await _unitOfWork.StockAdjustmentRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<StockAdjustmentDto>>(adjustments);
    }
    public async Task<IEnumerable<StockAdjustmentDto>> GetByMedicineIdAsync(Guid medicineId)
    {
        var adjustments = await _unitOfWork.StockAdjustmentRepository.GetByMedicineIdAsync(medicineId);
        return _mapper.Map<IEnumerable<StockAdjustmentDto>>(adjustments);
    }
    public async Task<StockAdjustmentDto> CreateAsync(CreateStockAdjustmentDto dto, Guid adjustedByUserId)
    {
        var medicine = await _unitOfWork.MedicineRepository.GetByIdAsync(dto.MedicineId);
        if (medicine == null)
        {
            throw new KeyNotFoundException("Medicine not found.");
        }
        if (dto.Type == StockAdjustmentType.Out && medicine.StockQuantity < dto.QuantityChanged)
        {
            throw new InvalidOperationException(
                $"Insufficient stock. Current stock is {medicine.StockQuantity}, cannot remove {dto.QuantityChanged}.");
        }
        // Apply the stock change to the medicine
        medicine.StockQuantity = dto.Type == StockAdjustmentType.In
            ? medicine.StockQuantity + dto.QuantityChanged
            : medicine.StockQuantity - dto.QuantityChanged;
        await _unitOfWork.MedicineRepository.UpdateAsync(medicine);
        var adjustment = new StockAdjustment
        {
            MedicineId = dto.MedicineId,
            Type = dto.Type,
            QuantityChanged = dto.QuantityChanged,
            StockAfterAdjustment = medicine.StockQuantity,
            Reason = dto.Reason,
            AdjustedByUserId = adjustedByUserId
        };
        await _unitOfWork.StockAdjustmentRepository.AddAsync(adjustment);
        await _unitOfWork.SaveChangesAsync();
        var created = await _unitOfWork.StockAdjustmentRepository.GetByMedicineIdAsync(dto.MedicineId);
        var latest = created.OrderByDescending(a => a.CreatedAt).First(a => a.Id == adjustment.Id);
        return _mapper.Map<StockAdjustmentDto>(latest);
    }
}

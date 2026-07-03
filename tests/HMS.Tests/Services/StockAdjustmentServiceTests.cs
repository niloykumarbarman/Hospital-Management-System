using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.StockAdjustment;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class StockAdjustmentServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IStockAdjustmentRepository> _stockAdjustmentRepoMock;
    private readonly Mock<IMedicineRepository> _medicineRepoMock;
    private readonly IMapper _mapper;
    private readonly StockAdjustmentService _sut; // system under test

    public StockAdjustmentServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _stockAdjustmentRepoMock = new Mock<IStockAdjustmentRepository>();
        _medicineRepoMock = new Mock<IMedicineRepository>();

        _unitOfWorkMock.Setup(u => u.StockAdjustmentRepository).Returns(_stockAdjustmentRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.MedicineRepository).Returns(_medicineRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<StockAdjustmentMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new StockAdjustmentService(_unitOfWorkMock.Object, _mapper);
    }

    private static Medicine MakeMedicine(int stockQuantity)
    {
        return new Medicine
        {
            Id = Guid.NewGuid(),
            Name = "Paracetamol",
            Unit = "Tablet",
            UnitPrice = 2,
            StockQuantity = stockQuantity
        };
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenMedicineDoesNotExist()
    {
        _medicineRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Medicine?)null);

        var dto = new CreateStockAdjustmentDto
        {
            MedicineId = Guid.NewGuid(),
            Type = StockAdjustmentType.In,
            QuantityChanged = 10
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto, Guid.NewGuid()));
    }

    [Fact]
    public async Task CreateAsync_ThrowsInvalidOperation_WhenOutQuantityExceedsStock()
    {
        var medicine = MakeMedicine(stockQuantity: 5);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        var dto = new CreateStockAdjustmentDto
        {
            MedicineId = medicine.Id,
            Type = StockAdjustmentType.Out,
            QuantityChanged = 6
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("Insufficient stock", ex.Message);
        _medicineRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Medicine>()), Times.Never);
        _stockAdjustmentRepoMock.Verify(r => r.AddAsync(It.IsAny<StockAdjustment>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_IncreasesStock_WhenTypeIn()
    {
        var medicine = MakeMedicine(stockQuantity: 20);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        StockAdjustment? captured = null;
        _stockAdjustmentRepoMock.Setup(r => r.AddAsync(It.IsAny<StockAdjustment>()))
            .Callback<StockAdjustment>(a => captured = a)
            .ReturnsAsync((StockAdjustment a) => a);
        _stockAdjustmentRepoMock.Setup(r => r.GetByMedicineIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() => new List<StockAdjustment>
            {
                new()
                {
                    Id = captured!.Id,
                    MedicineId = captured.MedicineId,
                    Medicine = medicine,
                    Type = captured.Type,
                    QuantityChanged = captured.QuantityChanged,
                    StockAfterAdjustment = captured.StockAfterAdjustment,
                    Reason = captured.Reason,
                    AdjustedByUserId = captured.AdjustedByUserId,
                    AdjustedByUser = new User { FullName = "Nurse Joy" }
                }
            });

        var dto = new CreateStockAdjustmentDto
        {
            MedicineId = medicine.Id,
            Type = StockAdjustmentType.In,
            QuantityChanged = 15,
            Reason = "New shipment"
        };

        var result = await _sut.CreateAsync(dto, Guid.NewGuid());

        Assert.Equal(35, medicine.StockQuantity);
        Assert.Equal(35, result.StockAfterAdjustment);
        Assert.Equal(StockAdjustmentType.In, result.Type);
        Assert.Equal("Paracetamol", result.MedicineName);
        Assert.Equal("Nurse Joy", result.AdjustedByUserName);
        _medicineRepoMock.Verify(r => r.UpdateAsync(It.Is<Medicine>(m => m.StockQuantity == 35)), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DecreasesStock_WhenTypeOut()
    {
        var medicine = MakeMedicine(stockQuantity: 20);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        StockAdjustment? captured = null;
        _stockAdjustmentRepoMock.Setup(r => r.AddAsync(It.IsAny<StockAdjustment>()))
            .Callback<StockAdjustment>(a => captured = a)
            .ReturnsAsync((StockAdjustment a) => a);
        _stockAdjustmentRepoMock.Setup(r => r.GetByMedicineIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() => new List<StockAdjustment>
            {
                new()
                {
                    Id = captured!.Id,
                    MedicineId = captured.MedicineId,
                    Medicine = medicine,
                    Type = captured.Type,
                    QuantityChanged = captured.QuantityChanged,
                    StockAfterAdjustment = captured.StockAfterAdjustment,
                    Reason = captured.Reason,
                    AdjustedByUserId = captured.AdjustedByUserId,
                    AdjustedByUser = new User { FullName = "Nurse Joy" }
                }
            });

        var dto = new CreateStockAdjustmentDto
        {
            MedicineId = medicine.Id,
            Type = StockAdjustmentType.Out,
            QuantityChanged = 8,
            Reason = "Dispensed to patient"
        };

        var result = await _sut.CreateAsync(dto, Guid.NewGuid());

        Assert.Equal(12, medicine.StockQuantity);
        Assert.Equal(12, result.StockAfterAdjustment);
        Assert.Equal(StockAdjustmentType.Out, result.Type);
        _medicineRepoMock.Verify(r => r.UpdateAsync(It.Is<Medicine>(m => m.StockQuantity == 12)), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_AllowsOutAdjustment_WhenQuantityEqualsExactStock()
    {
        var medicine = MakeMedicine(stockQuantity: 10);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        StockAdjustment? captured = null;
        _stockAdjustmentRepoMock.Setup(r => r.AddAsync(It.IsAny<StockAdjustment>()))
            .Callback<StockAdjustment>(a => captured = a)
            .ReturnsAsync((StockAdjustment a) => a);
        _stockAdjustmentRepoMock.Setup(r => r.GetByMedicineIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() => new List<StockAdjustment>
            {
                new()
                {
                    Id = captured!.Id,
                    MedicineId = captured.MedicineId,
                    Medicine = medicine,
                    Type = captured.Type,
                    QuantityChanged = captured.QuantityChanged,
                    StockAfterAdjustment = captured.StockAfterAdjustment,
                    Reason = captured.Reason,
                    AdjustedByUserId = captured.AdjustedByUserId,
                    AdjustedByUser = new User { FullName = "Nurse Joy" }
                }
            });

        var dto = new CreateStockAdjustmentDto
        {
            MedicineId = medicine.Id,
            Type = StockAdjustmentType.Out,
            QuantityChanged = 10
        };

        var result = await _sut.CreateAsync(dto, Guid.NewGuid());

        Assert.Equal(0, medicine.StockQuantity);
        Assert.Equal(0, result.StockAfterAdjustment);
    }
}

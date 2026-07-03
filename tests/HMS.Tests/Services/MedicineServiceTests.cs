using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.Medicine;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class MedicineServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMedicineRepository> _medicineRepoMock;
    private readonly IMapper _mapper;
    private readonly MedicineService _sut; // system under test

    public MedicineServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _medicineRepoMock = new Mock<IMedicineRepository>();

        _unitOfWorkMock.Setup(u => u.MedicineRepository).Returns(_medicineRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MedicineMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new MedicineService(_unitOfWorkMock.Object, _mapper);
    }

    private static Medicine MakeMedicine(int stockQuantity, int reorderLevel)
    {
        return new Medicine
        {
            Id = Guid.NewGuid(),
            Name = "Paracetamol",
            Unit = "Tablet",
            UnitPrice = 2,
            StockQuantity = stockQuantity,
            ReorderLevel = reorderLevel
        };
    }

    [Theory]
    [InlineData(5, 10, true)]   // below reorder level
    [InlineData(10, 10, true)]  // exactly at reorder level (<=  counts as low stock)
    [InlineData(11, 10, false)] // above reorder level
    [InlineData(0, 10, true)]   // completely out of stock
    public async Task GetByIdAsync_ComputesIsLowStock_Correctly(int stockQuantity, int reorderLevel, bool expectedIsLowStock)
    {
        var medicine = MakeMedicine(stockQuantity, reorderLevel);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        var result = await _sut.GetByIdAsync(medicine.Id);

        Assert.NotNull(result);
        Assert.Equal(expectedIsLowStock, result!.IsLowStock);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenMedicineDoesNotExist()
    {
        _medicineRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Medicine?)null);

        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetLowStockAsync_ReturnsOnlyWhatRepositoryReturns_MappedWithIsLowStockTrue()
    {
        var lowStockMedicines = new List<Medicine>
        {
            MakeMedicine(stockQuantity: 2, reorderLevel: 10),
            MakeMedicine(stockQuantity: 10, reorderLevel: 10)
        };
        _medicineRepoMock.Setup(r => r.GetLowStockAsync()).ReturnsAsync(lowStockMedicines);

        var result = (await _sut.GetLowStockAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.True(dto.IsLowStock));
        _medicineRepoMock.Verify(r => r.GetLowStockAsync(), Times.Once);
        _medicineRepoMock.Verify(r => r.GetAllAsync(), Times.Never); // must use the dedicated low-stock query, not filter all in memory
    }

    [Fact]
    public async Task GetLowStockAsync_ReturnsEmpty_WhenNothingIsLowStock()
    {
        _medicineRepoMock.Setup(r => r.GetLowStockAsync()).ReturnsAsync(new List<Medicine>());

        var result = await _sut.GetLowStockAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task CreateAsync_AddsMedicine_AndReturnsMappedDto()
    {
        var dto = new CreateMedicineDto
        {
            Name = "Napa",
            Unit = "Tablet",
            UnitPrice = 1.5m,
            StockQuantity = 100,
            ReorderLevel = 20
        };

        Medicine? captured = null;
        _medicineRepoMock.Setup(r => r.AddAsync(It.IsAny<Medicine>()))
            .Callback<Medicine>(m => captured = m)
            .ReturnsAsync((Medicine m) => m);

        var result = await _sut.CreateAsync(dto);

        Assert.Equal("Napa", result.Name);
        Assert.Equal(100, result.StockQuantity);
        Assert.False(result.IsLowStock); // 100 > 20
        Assert.Equal(100, captured!.StockQuantity);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenMedicineDoesNotExist()
    {
        _medicineRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Medicine?)null);

        var dto = new UpdateMedicineDto { Name = "Napa", Unit = "Tablet", UnitPrice = 2, ReorderLevel = 10 };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.UpdateAsync(Guid.NewGuid(), dto));
    }

    [Fact]
    public async Task UpdateAsync_DoesNotChangeStockQuantity_EvenThoughOtherFieldsUpdate()
    {
        var medicine = MakeMedicine(stockQuantity: 50, reorderLevel: 10);
        _medicineRepoMock.Setup(r => r.GetByIdAsync(medicine.Id)).ReturnsAsync(medicine);

        var dto = new UpdateMedicineDto
        {
            Name = "Napa Extra",
            GenericName = "Paracetamol 665mg",
            Manufacturer = "Beximco",
            Unit = "Tablet",
            UnitPrice = 3,
            ReorderLevel = 15
        };

        var result = await _sut.UpdateAsync(medicine.Id, dto);

        Assert.Equal("Napa Extra", result.Name);
        Assert.Equal(15, result.ReorderLevel);
        // StockQuantity must remain untouched by a plain update — stock changes must go
        // through the StockAdjustment flow for audit trail purposes.
        Assert.Equal(50, result.StockQuantity);
        Assert.Equal(50, medicine.StockQuantity);
        _medicineRepoMock.Verify(r => r.UpdateAsync(medicine), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenMedicineDoesNotExist()
    {
        _medicineRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.DeleteAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete_WhenMedicineExists()
    {
        var id = Guid.NewGuid();
        _medicineRepoMock.Setup(r => r.ExistsAsync(id)).ReturnsAsync(true);

        await _sut.DeleteAsync(id);

        _medicineRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}

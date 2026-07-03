using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.Patient;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class PatientServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IGenericRepository<Patient>> _patientGenericRepoMock;
    private readonly Mock<IPatientRepository> _patientRepoMock;
    private readonly IMapper _mapper;
    private readonly PatientService _sut; // system under test

    public PatientServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _patientGenericRepoMock = new Mock<IGenericRepository<Patient>>();
        _patientRepoMock = new Mock<IPatientRepository>();

        _unitOfWorkMock.Setup(u => u.Repository<Patient>()).Returns(_patientGenericRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.PatientRepository).Returns(_patientRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<PatientMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new PatientService(_unitOfWorkMock.Object, _mapper);
    }

    private static CreatePatientDto MakeCreateDto()
    {
        return new CreatePatientDto
        {
            FullName = "Rahim Uddin",
            Gender = Gender.Male,
            DateOfBirth = new DateTime(1990, 1, 1),
            PhoneNumber = "01700000000"
        };
    }

    [Theory]
    [InlineData(0, "PT-00001")]
    [InlineData(41, "PT-00042")]
    [InlineData(99999, "PT-100000")]
    public async Task CreateAsync_GeneratesSequentialPatientCode_FromTotalCreatedCount(int totalCreated, string expectedCode)
    {
        _patientRepoMock.Setup(r => r.GetTotalCreatedCountAsync()).ReturnsAsync(totalCreated);

        Patient? captured = null;
        _patientGenericRepoMock.Setup(r => r.AddAsync(It.IsAny<Patient>()))
            .Callback<Patient>(p => captured = p)
            .ReturnsAsync((Patient p) => p);

        var result = await _sut.CreateAsync(MakeCreateDto());

        Assert.Equal(expectedCode, result.PatientCode);
        Assert.Equal(expectedCode, captured!.PatientCode);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DoesNotUsePatientCodeFromDto_MappingIgnoresIt()
    {
        // CreatePatientDto has no PatientCode property at all, so this also guards
        // against the mapping profile accidentally requiring/using one.
        _patientRepoMock.Setup(r => r.GetTotalCreatedCountAsync()).ReturnsAsync(4);
        _patientGenericRepoMock.Setup(r => r.AddAsync(It.IsAny<Patient>()))
            .ReturnsAsync((Patient p) => p);

        var result = await _sut.CreateAsync(MakeCreateDto());

        Assert.Equal("PT-00005", result.PatientCode);
        Assert.Equal("Rahim Uddin", result.FullName);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenPatientDoesNotExist()
    {
        _patientGenericRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Patient?)null);

        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMappedDto_WhenPatientExists()
    {
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "PT-00010",
            FullName = "Karim Sheikh",
            Gender = Gender.Male,
            DateOfBirth = new DateTime(1985, 5, 20)
        };
        _patientGenericRepoMock.Setup(r => r.GetByIdAsync(patient.Id)).ReturnsAsync(patient);

        var result = await _sut.GetByIdAsync(patient.Id);

        Assert.NotNull(result);
        Assert.Equal("PT-00010", result!.PatientCode);
        Assert.Equal("Karim Sheikh", result.FullName);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenPatientDoesNotExist()
    {
        _patientGenericRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Patient?)null);

        var dto = new UpdatePatientDto { FullName = "New Name", Gender = Gender.Female, DateOfBirth = DateTime.Today };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.UpdateAsync(Guid.NewGuid(), dto));
    }

    [Fact]
    public async Task UpdateAsync_AppliesChanges_AndPreservesPatientCode()
    {
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "PT-00007",
            FullName = "Old Name",
            Gender = Gender.Male,
            DateOfBirth = new DateTime(1980, 1, 1),
            PhoneNumber = "01711111111"
        };
        _patientGenericRepoMock.Setup(r => r.GetByIdAsync(patient.Id)).ReturnsAsync(patient);

        var dto = new UpdatePatientDto
        {
            FullName = "Updated Name",
            Gender = Gender.Male,
            DateOfBirth = patient.DateOfBirth,
            PhoneNumber = "01799999999"
        };

        var result = await _sut.UpdateAsync(patient.Id, dto);

        Assert.Equal("Updated Name", result.FullName);
        Assert.Equal("01799999999", result.PhoneNumber);
        Assert.Equal("PT-00007", result.PatientCode); // must not change on update
        _patientGenericRepoMock.Verify(r => r.UpdateAsync(patient), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenPatientDoesNotExist()
    {
        _patientGenericRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.DeleteAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete_WhenPatientExists()
    {
        var id = Guid.NewGuid();
        _patientGenericRepoMock.Setup(r => r.ExistsAsync(id)).ReturnsAsync(true);

        await _sut.DeleteAsync(id);

        _patientGenericRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}

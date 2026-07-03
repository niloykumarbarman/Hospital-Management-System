using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.Prescription;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class PrescriptionServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IPrescriptionRepository> _prescriptionRepoMock;
    private readonly Mock<IGenericRepository<Prescription>> _prescriptionGenericRepoMock;
    private readonly Mock<IGenericRepository<Patient>> _patientRepoMock;
    private readonly Mock<IGenericRepository<Doctor>> _doctorRepoMock;
    private readonly Mock<IGenericRepository<MedicalRecord>> _medicalRecordRepoMock;
    private readonly Mock<IGenericRepository<Medicine>> _medicineRepoMock;
    private readonly IMapper _mapper;
    private readonly PrescriptionService _sut; // system under test

    public PrescriptionServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _prescriptionRepoMock = new Mock<IPrescriptionRepository>();
        _prescriptionGenericRepoMock = new Mock<IGenericRepository<Prescription>>();
        _patientRepoMock = new Mock<IGenericRepository<Patient>>();
        _doctorRepoMock = new Mock<IGenericRepository<Doctor>>();
        _medicalRecordRepoMock = new Mock<IGenericRepository<MedicalRecord>>();
        _medicineRepoMock = new Mock<IGenericRepository<Medicine>>();

        _unitOfWorkMock.Setup(u => u.PrescriptionRepository).Returns(_prescriptionRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Prescription>()).Returns(_prescriptionGenericRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Patient>()).Returns(_patientRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Doctor>()).Returns(_doctorRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<MedicalRecord>()).Returns(_medicalRecordRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Medicine>()).Returns(_medicineRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<PrescriptionMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new PrescriptionService(_unitOfWorkMock.Object, _mapper);
    }

    private static Prescription MakeDetailedPrescription(Guid id, Guid patientId, Guid doctorId, List<PrescriptionItem> items)
    {
        return new Prescription
        {
            Id = id,
            PatientId = patientId,
            Patient = new Patient { Id = patientId, FullName = "Rahim Uddin" },
            DoctorId = doctorId,
            Doctor = new Doctor { Id = doctorId, Specialization = "General Medicine", User = new User { FullName = "Dr. Karim" } },
            PrescriptionDate = new DateTime(2026, 7, 1),
            Items = items
        };
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenPatientDoesNotExist()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new CreatePrescriptionDto { PatientId = Guid.NewGuid(), DoctorId = Guid.NewGuid() };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto));
        _doctorRepoMock.Verify(r => r.ExistsAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenDoctorDoesNotExist()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new CreatePrescriptionDto { PatientId = Guid.NewGuid(), DoctorId = Guid.NewGuid() };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenMedicalRecordIdProvidedButMissing()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _medicalRecordRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new CreatePrescriptionDto
        {
            PatientId = Guid.NewGuid(),
            DoctorId = Guid.NewGuid(),
            MedicalRecordId = Guid.NewGuid()
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenAnItemMedicineDoesNotExist()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _medicineRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new CreatePrescriptionDto
        {
            PatientId = Guid.NewGuid(),
            DoctorId = Guid.NewGuid(),
            Items = new List<CreatePrescriptionItemDto>
            {
                new() { MedicineId = Guid.NewGuid(), Dosage = "500mg", Frequency = "Twice daily", DurationInDays = 5 }
            }
        };

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto));
        Assert.Contains("Medicine", ex.Message);
        _prescriptionGenericRepoMock.Verify(r => r.AddAsync(It.IsAny<Prescription>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_AddsPrescriptionWithItems_WhenAllValid()
    {
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var medicineId = Guid.NewGuid();

        _patientRepoMock.Setup(r => r.ExistsAsync(patientId)).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(doctorId)).ReturnsAsync(true);
        _medicineRepoMock.Setup(r => r.ExistsAsync(medicineId)).ReturnsAsync(true);

        var dto = new CreatePrescriptionDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            Notes = "Take after meals",
            Items = new List<CreatePrescriptionItemDto>
            {
                new() { MedicineId = medicineId, Dosage = "500mg", Frequency = "Twice daily", DurationInDays = 5 }
            }
        };

        Prescription? captured = null;
        _prescriptionGenericRepoMock.Setup(r => r.AddAsync(It.IsAny<Prescription>()))
            .Callback<Prescription>(p => captured = p)
            .ReturnsAsync((Prescription p) => p);

        var medicineLookup = new Dictionary<Guid, Medicine> { [medicineId] = new Medicine { Id = medicineId, Name = "Napa" } };

        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() =>
            {
                var entity = MakeDetailedPrescription(captured!.Id, patientId, doctorId, captured.Items.ToList());
                foreach (var item in entity.Items)
                {
                    item.Medicine = medicineLookup[item.MedicineId];
                }
                return entity;
            });

        var result = await _sut.CreateAsync(dto);

        Assert.Single(result.Items);
        Assert.Equal("Napa", result.Items[0].MedicineName);
        Assert.Equal("500mg", result.Items[0].Dosage);
        Assert.Equal("Rahim Uddin", result.PatientName);
        Assert.Equal("Dr. Karim", result.DoctorName);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenPrescriptionDoesNotExist()
    {
        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((Prescription?)null);

        var dto = new UpdatePrescriptionDto { PrescriptionDate = DateTime.Today };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.UpdateAsync(Guid.NewGuid(), dto));
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenNewItemMedicineDoesNotExist()
    {
        var id = Guid.NewGuid();
        var oldMedicineId = Guid.NewGuid();
        var oldItem = new PrescriptionItem { Id = Guid.NewGuid(), MedicineId = oldMedicineId, Medicine = new Medicine { Id = oldMedicineId, Name = "Napa" }, Dosage = "500mg", Frequency = "Once daily", DurationInDays = 3 };
        var existing = MakeDetailedPrescription(id, Guid.NewGuid(), Guid.NewGuid(), new List<PrescriptionItem> { oldItem });

        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(id)).ReturnsAsync(existing);
        _medicineRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new UpdatePrescriptionDto
        {
            PrescriptionDate = DateTime.Today,
            Items = new List<CreatePrescriptionItemDto>
            {
                new() { MedicineId = Guid.NewGuid(), Dosage = "250mg", Frequency = "Once daily", DurationInDays = 3 }
            }
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.UpdateAsync(id, dto));

        // Old items must remain untouched since validation failed before the clear/replace step
        Assert.Single(existing.Items);
        Assert.Equal(oldItem.Id, existing.Items.First().Id);
        _prescriptionGenericRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Prescription>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_FullyReplacesItems_RemovingOldOnesAndAddingNewOnes()
    {
        var id = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var oldMedicineId = Guid.NewGuid();
        var newMedicineId1 = Guid.NewGuid();
        var newMedicineId2 = Guid.NewGuid();

        var oldItem = new PrescriptionItem
        {
            Id = Guid.NewGuid(),
            MedicineId = oldMedicineId,
            Medicine = new Medicine { Id = oldMedicineId, Name = "Napa" },
            Dosage = "500mg",
            Frequency = "Once daily",
            DurationInDays = 3
        };
        var existing = MakeDetailedPrescription(id, patientId, doctorId, new List<PrescriptionItem> { oldItem });

        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(id)).ReturnsAsync(existing);
        _medicineRepoMock.Setup(r => r.ExistsAsync(newMedicineId1)).ReturnsAsync(true);
        _medicineRepoMock.Setup(r => r.ExistsAsync(newMedicineId2)).ReturnsAsync(true);

        var medicineLookup = new Dictionary<Guid, Medicine>
        {
            [oldMedicineId] = new Medicine { Id = oldMedicineId, Name = "Napa" },
            [newMedicineId1] = new Medicine { Id = newMedicineId1, Name = "Seclo" },
            [newMedicineId2] = new Medicine { Id = newMedicineId2, Name = "Ace" }
        };

        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(id))
            .ReturnsAsync(() =>
            {
                foreach (var item in existing.Items)
                {
                    item.Medicine = medicineLookup[item.MedicineId];
                }
                return existing;
            });

        var dto = new UpdatePrescriptionDto
        {
            PrescriptionDate = new DateTime(2026, 8, 1),
            Notes = "Revised after follow-up",
            Items = new List<CreatePrescriptionItemDto>
            {
                new() { MedicineId = newMedicineId1, Dosage = "20mg", Frequency = "Once daily", DurationInDays = 14 },
                new() { MedicineId = newMedicineId2, Dosage = "100mg", Frequency = "Twice daily", DurationInDays = 5 }
            }
        };

        var result = await _sut.UpdateAsync(id, dto);

        Assert.Equal(2, result.Items.Count);
        Assert.DoesNotContain(result.Items, i => i.MedicineId == oldMedicineId);
        Assert.Contains(result.Items, i => i.MedicineId == newMedicineId1 && i.MedicineName == "Seclo");
        Assert.Contains(result.Items, i => i.MedicineId == newMedicineId2 && i.MedicineName == "Ace");
        Assert.Equal("Revised after follow-up", result.Notes);
        Assert.Equal(patientId, result.PatientId); // immutable, untouched by update
        Assert.Equal(doctorId, result.DoctorId);   // immutable, untouched by update
        _prescriptionGenericRepoMock.Verify(r => r.UpdateAsync(existing), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ClearsAllItems_WhenNewItemListIsEmpty()
    {
        var id = Guid.NewGuid();
        var oldMedicineId = Guid.NewGuid();
        var oldItem = new PrescriptionItem { Id = Guid.NewGuid(), MedicineId = oldMedicineId, Medicine = new Medicine { Id = oldMedicineId, Name = "Napa" }, Dosage = "500mg", Frequency = "Once daily", DurationInDays = 3 };
        var existing = MakeDetailedPrescription(id, Guid.NewGuid(), Guid.NewGuid(), new List<PrescriptionItem> { oldItem });

        _prescriptionRepoMock.Setup(r => r.GetByIdWithDetailsAsync(id)).ReturnsAsync(() => existing);

        var dto = new UpdatePrescriptionDto
        {
            PrescriptionDate = DateTime.Today,
            Items = new List<CreatePrescriptionItemDto>()
        };

        var result = await _sut.UpdateAsync(id, dto);

        Assert.Empty(result.Items);
        Assert.Empty(existing.Items);
        _medicineRepoMock.Verify(r => r.ExistsAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenPrescriptionDoesNotExist()
    {
        _prescriptionGenericRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.DeleteAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete_WhenPrescriptionExists()
    {
        var id = Guid.NewGuid();
        _prescriptionGenericRepoMock.Setup(r => r.ExistsAsync(id)).ReturnsAsync(true);

        await _sut.DeleteAsync(id);

        _prescriptionGenericRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}

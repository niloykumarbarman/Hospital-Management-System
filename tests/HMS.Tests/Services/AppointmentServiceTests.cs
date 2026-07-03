using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.Appointment;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class AppointmentServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
    private readonly Mock<IGenericRepository<Appointment>> _appointmentGenericRepoMock;
    private readonly Mock<IGenericRepository<Patient>> _patientRepoMock;
    private readonly Mock<IGenericRepository<Doctor>> _doctorRepoMock;
    private readonly IMapper _mapper;
    private readonly AppointmentService _sut; // system under test

    public AppointmentServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _appointmentRepoMock = new Mock<IAppointmentRepository>();
        _appointmentGenericRepoMock = new Mock<IGenericRepository<Appointment>>();
        _patientRepoMock = new Mock<IGenericRepository<Patient>>();
        _doctorRepoMock = new Mock<IGenericRepository<Doctor>>();

        _unitOfWorkMock.Setup(u => u.AppointmentRepository).Returns(_appointmentRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Appointment>()).Returns(_appointmentGenericRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Patient>()).Returns(_patientRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Doctor>()).Returns(_doctorRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<AppointmentMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new AppointmentService(_unitOfWorkMock.Object, _mapper);
    }

    private static CreateAppointmentDto MakeCreateDto(Guid patientId, Guid doctorId)
    {
        return new CreateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            AppointmentDate = new DateTime(2026, 8, 10),
            AppointmentTime = new TimeSpan(10, 30, 0),
            ReasonForVisit = "Routine checkup"
        };
    }

    private static Appointment MakeDetailedAppointment(Guid id, Guid patientId, Guid doctorId, AppointmentStatus status)
    {
        return new Appointment
        {
            Id = id,
            PatientId = patientId,
            Patient = new Patient { Id = patientId, FullName = "Rahim Uddin" },
            DoctorId = doctorId,
            Doctor = new Doctor
            {
                Id = doctorId,
                Specialization = "Cardiology",
                User = new User { FullName = "Dr. Karim" }
            },
            AppointmentDate = new DateTime(2026, 8, 10),
            AppointmentTime = new TimeSpan(10, 30, 0),
            Status = status
        };
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenPatientDoesNotExist()
    {
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        _patientRepoMock.Setup(r => r.ExistsAsync(patientId)).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.CreateAsync(MakeCreateDto(patientId, doctorId)));

        _doctorRepoMock.Verify(r => r.ExistsAsync(It.IsAny<Guid>()), Times.Never);
        _appointmentRepoMock.Verify(r => r.HasConflictAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<TimeSpan>(), It.IsAny<Guid?>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenDoctorDoesNotExist()
    {
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        _patientRepoMock.Setup(r => r.ExistsAsync(patientId)).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(doctorId)).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.CreateAsync(MakeCreateDto(patientId, doctorId)));

        _appointmentRepoMock.Verify(r => r.HasConflictAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<TimeSpan>(), It.IsAny<Guid?>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ThrowsInvalidOperation_WhenDoctorAlreadyBooked()
    {
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var dto = MakeCreateDto(patientId, doctorId);

        _patientRepoMock.Setup(r => r.ExistsAsync(patientId)).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(doctorId)).ReturnsAsync(true);
        _appointmentRepoMock.Setup(r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, null))
            .ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateAsync(dto));

        Assert.Contains("already has an appointment", ex.Message);
        _appointmentGenericRepoMock.Verify(r => r.AddAsync(It.IsAny<Appointment>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_BooksAppointment_WhenNoConflict()
    {
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var dto = MakeCreateDto(patientId, doctorId);

        _patientRepoMock.Setup(r => r.ExistsAsync(patientId)).ReturnsAsync(true);
        _doctorRepoMock.Setup(r => r.ExistsAsync(doctorId)).ReturnsAsync(true);
        _appointmentRepoMock.Setup(r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, null))
            .ReturnsAsync(false);

        Appointment? captured = null;
        _appointmentGenericRepoMock.Setup(r => r.AddAsync(It.IsAny<Appointment>()))
            .Callback<Appointment>(a => captured = a)
            .ReturnsAsync((Appointment a) => a);

        _appointmentRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() => MakeDetailedAppointment(captured!.Id, patientId, doctorId, captured.Status));

        var result = await _sut.CreateAsync(dto);

        Assert.Equal(AppointmentStatus.Pending, result.Status); // entity default, untouched by mapping
        Assert.Equal("Rahim Uddin", result.PatientName);
        Assert.Equal("Dr. Karim", result.DoctorName);
        Assert.Equal("Cardiology", result.Specialization);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenAppointmentDoesNotExist()
    {
        _appointmentGenericRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Appointment?)null);

        var dto = new UpdateAppointmentDto
        {
            AppointmentDate = DateTime.Today,
            AppointmentTime = new TimeSpan(9, 0, 0),
            Status = AppointmentStatus.Confirmed
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.UpdateAsync(Guid.NewGuid(), dto));
    }

    [Fact]
    public async Task UpdateAsync_ExcludesOwnAppointmentId_WhenCheckingConflict()
    {
        var appointmentId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var existing = MakeDetailedAppointment(appointmentId, patientId, doctorId, AppointmentStatus.Pending);

        _appointmentGenericRepoMock.Setup(r => r.GetByIdAsync(appointmentId)).ReturnsAsync(existing);

        var dto = new UpdateAppointmentDto
        {
            AppointmentDate = new DateTime(2026, 8, 11),
            AppointmentTime = new TimeSpan(11, 0, 0),
            Status = AppointmentStatus.Confirmed
        };

        _appointmentRepoMock.Setup(r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, appointmentId))
            .ReturnsAsync(false);
        _appointmentRepoMock.Setup(r => r.GetByIdWithDetailsAsync(appointmentId))
            .ReturnsAsync(() => MakeDetailedAppointment(appointmentId, patientId, doctorId, dto.Status));

        await _sut.UpdateAsync(appointmentId, dto);

        // Must exclude its own id, otherwise every reschedule of an unchanged slot would false-positive
        _appointmentRepoMock.Verify(
            r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, appointmentId), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsInvalidOperation_WhenNewSlotConflicts()
    {
        var appointmentId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var existing = MakeDetailedAppointment(appointmentId, patientId, doctorId, AppointmentStatus.Pending);

        _appointmentGenericRepoMock.Setup(r => r.GetByIdAsync(appointmentId)).ReturnsAsync(existing);

        var dto = new UpdateAppointmentDto
        {
            AppointmentDate = new DateTime(2026, 8, 12),
            AppointmentTime = new TimeSpan(14, 0, 0),
            Status = AppointmentStatus.Confirmed
        };

        _appointmentRepoMock.Setup(r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, appointmentId))
            .ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.UpdateAsync(appointmentId, dto));

        Assert.Contains("already has an appointment", ex.Message);
        _appointmentGenericRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Appointment>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesStatus_WhenNoConflict()
    {
        var appointmentId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var existing = MakeDetailedAppointment(appointmentId, patientId, doctorId, AppointmentStatus.Pending);

        _appointmentGenericRepoMock.Setup(r => r.GetByIdAsync(appointmentId)).ReturnsAsync(existing);

        var dto = new UpdateAppointmentDto
        {
            AppointmentDate = existing.AppointmentDate,
            AppointmentTime = existing.AppointmentTime,
            Status = AppointmentStatus.Completed,
            Notes = "Patient responded well to treatment"
        };

        _appointmentRepoMock.Setup(r => r.HasConflictAsync(doctorId, dto.AppointmentDate, dto.AppointmentTime, appointmentId))
            .ReturnsAsync(false);
        _appointmentRepoMock.Setup(r => r.GetByIdWithDetailsAsync(appointmentId))
            .ReturnsAsync(() => MakeDetailedAppointment(appointmentId, patientId, doctorId, dto.Status));

        var result = await _sut.UpdateAsync(appointmentId, dto);

        Assert.Equal(AppointmentStatus.Completed, result.Status);
        _appointmentGenericRepoMock.Verify(r => r.UpdateAsync(existing), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenAppointmentDoesNotExist()
    {
        _appointmentGenericRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.DeleteAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete_WhenAppointmentExists()
    {
        var id = Guid.NewGuid();
        _appointmentGenericRepoMock.Setup(r => r.ExistsAsync(id)).ReturnsAsync(true);

        await _sut.DeleteAsync(id);

        _appointmentGenericRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}

using AutoMapper;
using HMS.Application.DTOs.Appointment;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AppointmentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<AppointmentDto>> GetAllAsync()
    {
        var appointments = await _unitOfWork.AppointmentRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
    }

    public async Task<AppointmentDto?> GetByIdAsync(Guid id)
    {
        var appointment = await _unitOfWork.AppointmentRepository.GetByIdWithDetailsAsync(id);
        return appointment == null ? null : _mapper.Map<AppointmentDto>(appointment);
    }

    public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto)
    {
        // Verify Patient exists
        var patientExists = await _unitOfWork.Repository<Patient>().ExistsAsync(dto.PatientId);
        if (!patientExists)
        {
            throw new KeyNotFoundException("Patient not found.");
        }

        // Verify Doctor exists
        var doctorExists = await _unitOfWork.Repository<Doctor>().ExistsAsync(dto.DoctorId);
        if (!doctorExists)
        {
            throw new KeyNotFoundException("Doctor not found.");
        }

        // Prevent double-booking the same doctor at the same date/time
        var hasConflict = await _unitOfWork.AppointmentRepository.HasConflictAsync(
            dto.DoctorId, dto.AppointmentDate, dto.AppointmentTime);
        if (hasConflict)
        {
            throw new InvalidOperationException("This doctor already has an appointment at the selected date and time.");
        }

        var appointment = _mapper.Map<Appointment>(dto);
        await _unitOfWork.Repository<Appointment>().AddAsync(appointment);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.AppointmentRepository.GetByIdWithDetailsAsync(appointment.Id);
        return _mapper.Map<AppointmentDto>(created);
    }

    public async Task<AppointmentDto> UpdateAsync(Guid id, UpdateAppointmentDto dto)
    {
        var appointment = await _unitOfWork.Repository<Appointment>().GetByIdAsync(id);
        if (appointment == null)
        {
            throw new KeyNotFoundException("Appointment not found.");
        }

        // If date/time changed, re-check for conflicts (excluding this appointment itself)
        var hasConflict = await _unitOfWork.AppointmentRepository.HasConflictAsync(
            appointment.DoctorId, dto.AppointmentDate, dto.AppointmentTime, id);
        if (hasConflict)
        {
            throw new InvalidOperationException("This doctor already has an appointment at the selected date and time.");
        }

        _mapper.Map(dto, appointment);
        await _unitOfWork.Repository<Appointment>().UpdateAsync(appointment);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.AppointmentRepository.GetByIdWithDetailsAsync(id);
        return _mapper.Map<AppointmentDto>(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<Appointment>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Appointment not found.");
        }
        await _unitOfWork.Repository<Appointment>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}

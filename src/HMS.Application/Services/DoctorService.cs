using AutoMapper;
using HMS.Application.DTOs.Doctor;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class DoctorService : IDoctorService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DoctorService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<DoctorDto>> GetAllAsync()
    {
        var doctors = await _unitOfWork.DoctorRepository.GetAllWithUserAsync();
        return _mapper.Map<IEnumerable<DoctorDto>>(doctors);
    }

    public async Task<DoctorDto?> GetByIdAsync(Guid id)
    {
        var doctor = await _unitOfWork.DoctorRepository.GetByIdWithUserAsync(id);
        return doctor == null ? null : _mapper.Map<DoctorDto>(doctor);
    }

    public async Task<DoctorDto> CreateAsync(CreateDoctorDto dto)
    {
        // Ensure the referenced user exists and has the Doctor role
        var user = await _unitOfWork.Repository<User>().GetByIdAsync(dto.UserId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }
        if (user.Role != UserRole.Doctor)
        {
            throw new InvalidOperationException("Referenced user does not have the Doctor role.");
        }

        var doctor = _mapper.Map<Doctor>(dto);
        await _unitOfWork.Repository<Doctor>().AddAsync(doctor);
        await _unitOfWork.SaveChangesAsync();

        // Reload with User included so the response DTO has FullName/Email populated
        var created = await _unitOfWork.DoctorRepository.GetByIdWithUserAsync(doctor.Id);
        return _mapper.Map<DoctorDto>(created);
    }

    public async Task<DoctorDto> UpdateAsync(Guid id, UpdateDoctorDto dto)
    {
        var doctor = await _unitOfWork.Repository<Doctor>().GetByIdAsync(id);
        if (doctor == null)
        {
            throw new KeyNotFoundException("Doctor not found.");
        }

        _mapper.Map(dto, doctor);
        await _unitOfWork.Repository<Doctor>().UpdateAsync(doctor);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.DoctorRepository.GetByIdWithUserAsync(id);
        return _mapper.Map<DoctorDto>(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.Repository<Doctor>().ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Doctor not found.");
        }
        await _unitOfWork.Repository<Doctor>().DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}

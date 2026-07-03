using HMS.Application.DTOs.Doctor;

namespace HMS.Application.Interfaces;

public interface IDoctorService
{
    Task<IEnumerable<DoctorDto>> GetAllAsync();
    Task<DoctorDto?> GetByIdAsync(Guid id);
    Task<DoctorDto> CreateAsync(CreateDoctorDto dto);
    Task<DoctorDto> UpdateAsync(Guid id, UpdateDoctorDto dto);
    Task DeleteAsync(Guid id);
}

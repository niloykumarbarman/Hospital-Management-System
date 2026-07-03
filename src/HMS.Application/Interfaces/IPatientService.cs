using HMS.Application.DTOs.Patient;

namespace HMS.Application.Interfaces;

public interface IPatientService
{
    Task<IEnumerable<PatientDto>> GetAllAsync();
    Task<PatientDto?> GetByIdAsync(Guid id);
    Task<PatientDto> CreateAsync(CreatePatientDto dto);
    Task<PatientDto> UpdateAsync(Guid id, UpdatePatientDto dto);
    Task DeleteAsync(Guid id);
}

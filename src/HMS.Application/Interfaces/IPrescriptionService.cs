using HMS.Application.DTOs.Prescription;

namespace HMS.Application.Interfaces;

public interface IPrescriptionService
{
    Task<IEnumerable<PrescriptionDto>> GetAllAsync();
    Task<PrescriptionDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<PrescriptionDto>> GetByPatientIdAsync(Guid patientId);
    Task<PrescriptionDto> CreateAsync(CreatePrescriptionDto dto);
    Task<PrescriptionDto> UpdateAsync(Guid id, UpdatePrescriptionDto dto);
    Task DeleteAsync(Guid id);
}

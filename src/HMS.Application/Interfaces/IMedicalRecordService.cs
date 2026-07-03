using HMS.Application.DTOs.MedicalRecord;

namespace HMS.Application.Interfaces;

public interface IMedicalRecordService
{
    Task<IEnumerable<MedicalRecordDto>> GetAllAsync();
    Task<MedicalRecordDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<MedicalRecordDto>> GetByPatientIdAsync(Guid patientId);
    Task<MedicalRecordDto> CreateAsync(CreateMedicalRecordDto dto);
    Task<MedicalRecordDto> UpdateAsync(Guid id, UpdateMedicalRecordDto dto);
    Task DeleteAsync(Guid id);
}

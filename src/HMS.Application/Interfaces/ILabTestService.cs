using HMS.Application.DTOs.LabTest;

namespace HMS.Application.Interfaces;

public interface ILabTestService
{
    Task<IEnumerable<LabTestDto>> GetAllAsync();
    Task<LabTestDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<LabTestDto>> GetByPatientIdAsync(Guid patientId);
    Task<LabTestDto> CreateAsync(CreateLabTestDto dto);
    Task<LabTestDto> UpdateAsync(Guid id, UpdateLabTestDto dto);
    Task DeleteAsync(Guid id);
}

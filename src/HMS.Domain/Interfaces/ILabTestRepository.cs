using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// LabTest-specific repository to eager-load Patient details
public interface ILabTestRepository : IGenericRepository<LabTest>
{
    Task<IEnumerable<LabTest>> GetAllWithDetailsAsync();
    Task<LabTest?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<LabTest>> GetByPatientIdAsync(Guid patientId);
}

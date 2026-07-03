using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// MedicalRecord-specific repository to eager-load Patient and Doctor (with User) details
public interface IMedicalRecordRepository : IGenericRepository<MedicalRecord>
{
    Task<IEnumerable<MedicalRecord>> GetAllWithDetailsAsync();
    Task<MedicalRecord?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<MedicalRecord>> GetByPatientIdAsync(Guid patientId);
}

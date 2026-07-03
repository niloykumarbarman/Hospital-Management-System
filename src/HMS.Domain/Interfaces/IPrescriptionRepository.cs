using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// Prescription-specific repository to eager-load Patient, Doctor (with User), and Items (with Medicine)
public interface IPrescriptionRepository : IGenericRepository<Prescription>
{
    Task<IEnumerable<Prescription>> GetAllWithDetailsAsync();
    Task<Prescription?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Prescription>> GetByPatientIdAsync(Guid patientId);
}

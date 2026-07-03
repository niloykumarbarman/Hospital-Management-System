using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// Patient-specific repository to support generating unique sequential patient codes
public interface IPatientRepository : IGenericRepository<Patient>
{
    // Counts ALL patients ever created (including soft-deleted) to avoid PatientCode collisions
    Task<int> GetTotalCreatedCountAsync();
}

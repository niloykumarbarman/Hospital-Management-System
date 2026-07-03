using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// Doctor-specific repository to support eager-loading the related User entity
public interface IDoctorRepository : IGenericRepository<Doctor>
{
    Task<IEnumerable<Doctor>> GetAllWithUserAsync();
    Task<Doctor?> GetByIdWithUserAsync(Guid id);
}

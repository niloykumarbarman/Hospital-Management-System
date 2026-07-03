using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// User-specific repository to support eager-loading the related Doctor profile
// (used to detect which Doctor-role users don't have a Doctor profile yet)
public interface IUserRepository : IGenericRepository<User>
{
    Task<IEnumerable<User>> GetAllWithDoctorAsync();
}

using HMS.Application.DTOs.User;

namespace HMS.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllAsync(string? role, bool onlyUnassignedDoctors);
}

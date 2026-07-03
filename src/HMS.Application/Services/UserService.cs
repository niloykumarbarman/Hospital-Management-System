using AutoMapper;
using HMS.Application.DTOs.User;
using HMS.Application.Interfaces;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;

namespace HMS.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync(string? role, bool onlyUnassignedDoctors)
    {
        var users = await _unitOfWork.UserRepository.GetAllWithDoctorAsync();

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            users = users.Where(u => u.Role == parsedRole);
        }

        if (onlyUnassignedDoctors)
        {
            users = users.Where(u => u.Role == UserRole.Doctor && u.Doctor == null);
        }

        return _mapper.Map<IEnumerable<UserDto>>(users);
    }
}

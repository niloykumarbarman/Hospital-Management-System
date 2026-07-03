using AutoMapper;
using HMS.Application.DTOs.User;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        // Entity -> DTO (Role enum flattened to string; HasDoctorProfile requires User.Doctor eager-loaded)
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()))
            .ForMember(dest => dest.HasDoctorProfile, opt => opt.MapFrom(src => src.Doctor != null));
    }
}

using AutoMapper;
using HMS.Application.DTOs.Doctor;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class DoctorMappingProfile : Profile
{
    public DoctorMappingProfile()
    {
        // Entity -> DTO (flatten linked User fields; User must be eager-loaded via DoctorRepository)
        CreateMap<Doctor, DoctorDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User.PhoneNumber));

        // CreateDto -> Entity (UserId is set directly; User navigation is not touched here)
        CreateMap<CreateDoctorDto, Doctor>();

        // UpdateDto -> Entity (profile fields only; UserId is never changed after creation)
        CreateMap<UpdateDoctorDto, Doctor>();
    }
}

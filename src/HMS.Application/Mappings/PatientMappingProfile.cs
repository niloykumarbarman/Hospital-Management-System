using AutoMapper;
using HMS.Application.DTOs.Patient;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class PatientMappingProfile : Profile
{
    public PatientMappingProfile()
    {
        // Entity -> DTO (read)
        CreateMap<Patient, PatientDto>();

        // CreateDto -> Entity (PatientCode is set manually in the service, ignore here)
        CreateMap<CreatePatientDto, Patient>()
            .ForMember(dest => dest.PatientCode, opt => opt.Ignore());

        // UpdateDto -> Entity (apply changes onto existing tracked entity)
        CreateMap<UpdatePatientDto, Patient>();
    }
}

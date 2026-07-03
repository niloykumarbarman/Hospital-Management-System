using AutoMapper;
using HMS.Application.DTOs.LabTest;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class LabTestMappingProfile : Profile
{
    public LabTestMappingProfile()
    {
        // Entity -> DTO (flatten Patient name; Patient must be eager-loaded via LabTestRepository)
        CreateMap<LabTest, LabTestDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName));

        CreateMap<CreateLabTestDto, LabTest>();
        CreateMap<UpdateLabTestDto, LabTest>();
    }
}

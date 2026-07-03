using AutoMapper;
using HMS.Application.DTOs.MedicalRecord;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class MedicalRecordMappingProfile : Profile
{
    public MedicalRecordMappingProfile()
    {
        // Entity -> DTO (flatten Patient name and Doctor name/specialization;
        // Patient and Doctor.User must be eager-loaded via MedicalRecordRepository)
        CreateMap<MedicalRecord, MedicalRecordDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName))
            .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.User.FullName))
            .ForMember(dest => dest.Specialization, opt => opt.MapFrom(src => src.Doctor.Specialization));

        CreateMap<CreateMedicalRecordDto, MedicalRecord>();
        CreateMap<UpdateMedicalRecordDto, MedicalRecord>();
    }
}

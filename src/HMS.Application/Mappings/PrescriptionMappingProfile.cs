using AutoMapper;
using HMS.Application.DTOs.Prescription;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class PrescriptionMappingProfile : Profile
{
    public PrescriptionMappingProfile()
    {
        CreateMap<Prescription, PrescriptionDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName))
            .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.User.FullName))
            .ForMember(dest => dest.Specialization, opt => opt.MapFrom(src => src.Doctor.Specialization));

        CreateMap<PrescriptionItem, PrescriptionItemDto>()
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.Medicine.Name));

        // Items are handled manually in the service (need MedicineId validation before mapping)
        CreateMap<CreatePrescriptionDto, Prescription>()
            .ForMember(dest => dest.Items, opt => opt.Ignore());

        CreateMap<CreatePrescriptionItemDto, PrescriptionItem>();
    }
}

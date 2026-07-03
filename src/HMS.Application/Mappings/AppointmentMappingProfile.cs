using AutoMapper;
using HMS.Application.DTOs.Appointment;
using HMS.Domain.Entities;

namespace HMS.Application.Mappings;

public class AppointmentMappingProfile : Profile
{
    public AppointmentMappingProfile()
    {
        // Entity -> DTO (flatten Patient name and Doctor name/specialization;
        // Patient and Doctor.User must be eager-loaded via AppointmentRepository)
        CreateMap<Appointment, AppointmentDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName))
            .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.User.FullName))
            .ForMember(dest => dest.Specialization, opt => opt.MapFrom(src => src.Doctor.Specialization));

        // CreateDto -> Entity (Status defaults to Pending via entity's own default)
        CreateMap<CreateAppointmentDto, Appointment>();

        // UpdateDto -> Entity
        CreateMap<UpdateAppointmentDto, Appointment>();
    }
}

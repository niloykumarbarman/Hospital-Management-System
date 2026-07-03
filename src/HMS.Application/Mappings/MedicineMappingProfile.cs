using AutoMapper;
using HMS.Application.DTOs.Medicine;
using HMS.Domain.Entities;
namespace HMS.Application.Mappings;
public class MedicineMappingProfile : Profile
{
    public MedicineMappingProfile()
    {
        // Entity -> DTO (IsLowStock is computed, not stored)
        CreateMap<Medicine, MedicineDto>()
            .ForMember(dest => dest.IsLowStock, opt => opt.MapFrom(src => src.StockQuantity <= src.ReorderLevel));
        CreateMap<CreateMedicineDto, Medicine>();
        CreateMap<UpdateMedicineDto, Medicine>();
    }
}

using AutoMapper;
using HMS.Application.DTOs.StockAdjustment;
using HMS.Domain.Entities;
namespace HMS.Application.Mappings;
public class StockAdjustmentMappingProfile : Profile
{
    public StockAdjustmentMappingProfile()
    {
        // Entity -> DTO (flatten Medicine name and adjusting user's name;
        // Medicine and AdjustedByUser must be eager-loaded via StockAdjustmentRepository)
        CreateMap<StockAdjustment, StockAdjustmentDto>()
            .ForMember(dest => dest.MedicineName, opt => opt.MapFrom(src => src.Medicine.Name))
            .ForMember(dest => dest.AdjustedByUserName, opt => opt.MapFrom(src => src.AdjustedByUser.FullName));
        // CreateStockAdjustmentDto -> Entity mapping is NOT auto-mapped here.
        // StockAdjustment creation involves business logic (StockAfterAdjustment calculation,
        // AdjustedByUserId from JWT claim) that must be handled explicitly in the Service layer.
    }
}

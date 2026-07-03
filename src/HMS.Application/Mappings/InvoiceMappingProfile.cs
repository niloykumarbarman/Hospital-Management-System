using AutoMapper;
using HMS.Application.DTOs.Invoice;
using HMS.Domain.Entities;
namespace HMS.Application.Mappings;
public class InvoiceMappingProfile : Profile
{
    public InvoiceMappingProfile()
    {
        // Entity -> DTO (flatten Patient name; Patient and Items must be eager-loaded via InvoiceRepository)
        CreateMap<Invoice, InvoiceDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName));
        CreateMap<InvoiceItem, InvoiceItemDto>();
        // CreateInvoiceDto -> Invoice mapping is NOT auto-mapped here.
        // Invoice creation involves business logic (InvoiceNumber generation, SubTotal/TotalAmount
        // calculation) that must be handled explicitly in the Service layer.
    }
}

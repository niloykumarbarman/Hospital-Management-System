using AutoMapper;
using HMS.Application.DTOs.Invoice;
using HMS.Application.Interfaces;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
namespace HMS.Application.Services;
public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public InvoiceService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<IEnumerable<InvoiceDto>> GetAllAsync()
    {
        var invoices = await _unitOfWork.InvoiceRepository.GetAllWithDetailsAsync();
        return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
    }
    public async Task<InvoiceDto?> GetByIdAsync(Guid id)
    {
        var invoice = await _unitOfWork.InvoiceRepository.GetByIdWithDetailsAsync(id);
        return invoice == null ? null : _mapper.Map<InvoiceDto>(invoice);
    }
    public async Task<IEnumerable<InvoiceDto>> GetByPatientIdAsync(Guid patientId)
    {
        var invoices = await _unitOfWork.InvoiceRepository.GetByPatientIdAsync(patientId);
        return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
    }
    public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto)
    {
        var patientExists = await _unitOfWork.Repository<Patient>().ExistsAsync(dto.PatientId);
        if (!patientExists)
        {
            throw new KeyNotFoundException("Patient not found.");
        }
        // Build items and calculate each SubTotal
        var items = dto.Items.Select(i => new InvoiceItem
        {
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            SubTotal = i.Quantity * i.UnitPrice
        }).ToList();
        var totalAmount = items.Sum(i => i.SubTotal);
        // Use total-ever-created count (including soft-deleted) to guarantee a unique InvoiceNumber
        var totalCreated = await _unitOfWork.InvoiceRepository.GetTotalCreatedCountAsync();
        var nextNumber = totalCreated + 1;
        var invoice = new Invoice
        {
            InvoiceNumber = $"INV-{nextNumber:D5}",
            PatientId = dto.PatientId,
            InvoiceDate = dto.InvoiceDate,
            TotalAmount = totalAmount,
            PaidAmount = 0,
            DueAmount = totalAmount,
            PaymentStatus = PaymentStatus.Unpaid,
            Items = items
        };
        await _unitOfWork.InvoiceRepository.AddAsync(invoice);
        await _unitOfWork.SaveChangesAsync();
        var created = await _unitOfWork.InvoiceRepository.GetByIdWithDetailsAsync(invoice.Id);
        return _mapper.Map<InvoiceDto>(created);
    }
    public async Task<InvoiceDto> RecordPaymentAsync(Guid id, RecordPaymentDto dto)
    {
        var invoice = await _unitOfWork.InvoiceRepository.GetByIdWithDetailsAsync(id);
        if (invoice == null)
        {
            throw new KeyNotFoundException("Invoice not found.");
        }
        if (invoice.PaymentStatus == PaymentStatus.Paid)
        {
            throw new InvalidOperationException("This invoice is already fully paid.");
        }
        var remainingDue = invoice.TotalAmount - invoice.PaidAmount;
        if (dto.AmountPaid > remainingDue)
        {
            throw new InvalidOperationException(
                $"Amount paid ({dto.AmountPaid}) exceeds the remaining due amount ({remainingDue}).");
        }
        invoice.PaidAmount += dto.AmountPaid;
        invoice.DueAmount = invoice.TotalAmount - invoice.PaidAmount;
        invoice.PaymentStatus = invoice.DueAmount <= 0
            ? PaymentStatus.Paid
            : PaymentStatus.PartiallyPaid;
        await _unitOfWork.InvoiceRepository.UpdateAsync(invoice);
        await _unitOfWork.SaveChangesAsync();
        var updated = await _unitOfWork.InvoiceRepository.GetByIdWithDetailsAsync(id);
        return _mapper.Map<InvoiceDto>(updated);
    }
    public async Task DeleteAsync(Guid id)
    {
        var exists = await _unitOfWork.InvoiceRepository.ExistsAsync(id);
        if (!exists)
        {
            throw new KeyNotFoundException("Invoice not found.");
        }
        await _unitOfWork.InvoiceRepository.DeleteAsync(id);
        await _unitOfWork.SaveChangesAsync();
    }
}

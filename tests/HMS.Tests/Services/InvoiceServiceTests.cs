using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using HMS.Application.DTOs.Invoice;
using HMS.Application.Mappings;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using Moq;
using Xunit;

namespace HMS.Tests.Services;

public class InvoiceServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IInvoiceRepository> _invoiceRepoMock;
    private readonly Mock<IGenericRepository<Patient>> _patientRepoMock;
    private readonly IMapper _mapper;
    private readonly InvoiceService _sut; // system under test

    public InvoiceServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _invoiceRepoMock = new Mock<IInvoiceRepository>();
        _patientRepoMock = new Mock<IGenericRepository<Patient>>();

        _unitOfWorkMock.Setup(u => u.InvoiceRepository).Returns(_invoiceRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Repository<Patient>()).Returns(_patientRepoMock.Object);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<InvoiceMappingProfile>(), NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _sut = new InvoiceService(_unitOfWorkMock.Object, _mapper);
    }

    private static Invoice MakeInvoice(decimal total, decimal paid, PaymentStatus status)
    {
        return new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = "INV-00001",
            PatientId = Guid.NewGuid(),
            Patient = new Patient { FullName = "Test Patient" },
            TotalAmount = total,
            PaidAmount = paid,
            DueAmount = total - paid,
            PaymentStatus = status,
            Items = new List<InvoiceItem>()
        };
    }

    [Fact]
    public async Task CreateAsync_ThrowsKeyNotFound_WhenPatientDoesNotExist()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        var dto = new CreateInvoiceDto
        {
            PatientId = Guid.NewGuid(),
            Items = new List<CreateInvoiceItemDto>
            {
                new() { Description = "Consultation", Quantity = 1, UnitPrice = 100 }
            }
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_CalculatesTotalAmount_FromItems()
    {
        _patientRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(true);
        _invoiceRepoMock.Setup(r => r.GetTotalCreatedCountAsync()).ReturnsAsync(0);

        Invoice? captured = null;
        _invoiceRepoMock.Setup(r => r.AddAsync(It.IsAny<Invoice>()))
            .Callback<Invoice>(inv => captured = inv)
            .ReturnsAsync((Invoice inv) => inv);

        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>()))
            .ReturnsAsync(() => captured);

        var dto = new CreateInvoiceDto
        {
            PatientId = Guid.NewGuid(),
            Items = new List<CreateInvoiceItemDto>
            {
                new() { Description = "Consultation", Quantity = 2, UnitPrice = 150 },
                new() { Description = "Lab Test", Quantity = 1, UnitPrice = 200 }
            }
        };

        var result = await _sut.CreateAsync(dto);

        Assert.Equal(500, result.TotalAmount); // (2*150) + (1*200)
        Assert.Equal("INV-00001", result.InvoiceNumber);
        Assert.Equal(PaymentStatus.Unpaid, captured!.PaymentStatus);
        Assert.Equal(0, captured.PaidAmount);
        Assert.Equal(500, captured.DueAmount);
    }

    [Fact]
    public async Task RecordPaymentAsync_ThrowsKeyNotFound_WhenInvoiceMissing()
    {
        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Invoice?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _sut.RecordPaymentAsync(Guid.NewGuid(), new RecordPaymentDto { AmountPaid = 50 }));
    }

    [Fact]
    public async Task RecordPaymentAsync_ThrowsInvalidOperation_WhenAlreadyFullyPaid()
    {
        var invoice = MakeInvoice(total: 500, paid: 500, status: PaymentStatus.Paid);
        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(invoice.Id)).ReturnsAsync(invoice);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RecordPaymentAsync(invoice.Id, new RecordPaymentDto { AmountPaid = 10 }));
    }

    [Fact]
    public async Task RecordPaymentAsync_ThrowsInvalidOperation_WhenOverpaying()
    {
        var invoice = MakeInvoice(total: 500, paid: 200, status: PaymentStatus.PartiallyPaid);
        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(invoice.Id)).ReturnsAsync(invoice);

        // remaining due = 300, paying 301 should fail
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RecordPaymentAsync(invoice.Id, new RecordPaymentDto { AmountPaid = 301 }));

        Assert.Contains("exceeds", ex.Message);
    }

    [Fact]
    public async Task RecordPaymentAsync_SetsPartiallyPaid_WhenPaymentLessThanDue()
    {
        var invoice = MakeInvoice(total: 500, paid: 0, status: PaymentStatus.Unpaid);
        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(invoice.Id)).ReturnsAsync(invoice);

        var result = await _sut.RecordPaymentAsync(invoice.Id, new RecordPaymentDto { AmountPaid = 200 });

        Assert.Equal(PaymentStatus.PartiallyPaid, result.PaymentStatus);
        Assert.Equal(200, result.PaidAmount);
        Assert.Equal(300, result.DueAmount);
    }

    [Fact]
    public async Task RecordPaymentAsync_SetsPaid_WhenPaymentCoversFullDue()
    {
        var invoice = MakeInvoice(total: 500, paid: 200, status: PaymentStatus.PartiallyPaid);
        _invoiceRepoMock.Setup(r => r.GetByIdWithDetailsAsync(invoice.Id)).ReturnsAsync(invoice);

        var result = await _sut.RecordPaymentAsync(invoice.Id, new RecordPaymentDto { AmountPaid = 300 });

        Assert.Equal(PaymentStatus.Paid, result.PaymentStatus);
        Assert.Equal(500, result.PaidAmount);
        Assert.Equal(0, result.DueAmount);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenInvoiceDoesNotExist()
    {
        _invoiceRepoMock.Setup(r => r.ExistsAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.DeleteAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete_WhenInvoiceExists()
    {
        var id = Guid.NewGuid();
        _invoiceRepoMock.Setup(r => r.ExistsAsync(id)).ReturnsAsync(true);

        await _sut.DeleteAsync(id);

        _invoiceRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}

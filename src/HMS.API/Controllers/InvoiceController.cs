using FluentValidation;
using HMS.Application.DTOs.Invoice;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace HMS.API.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IValidator<CreateInvoiceDto> _createValidator;
    private readonly IValidator<RecordPaymentDto> _paymentValidator;
    public InvoiceController(
        IInvoiceService invoiceService,
        IValidator<CreateInvoiceDto> createValidator,
        IValidator<RecordPaymentDto> paymentValidator)
    {
        _invoiceService = invoiceService;
        _createValidator = createValidator;
        _paymentValidator = paymentValidator;
    }
    // GET: api/Invoice
    [HttpGet]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetAll()
    {
        var invoices = await _invoiceService.GetAllAsync();
        return Ok(invoices);
    }
    // GET: api/Invoice/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);
        if (invoice == null)
        {
            return NotFound(new { message = "Invoice not found." });
        }
        return Ok(invoice);
    }
    // GET: api/Invoice/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetByPatientId(Guid patientId)
    {
        var invoices = await _invoiceService.GetByPatientIdAsync(patientId);
        return Ok(invoices);
    }
    // POST: api/Invoice
    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }
        var created = await _invoiceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
    // POST: api/Invoice/{id}/payment
    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentDto dto)
    {
        var validationResult = await _paymentValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }
        var updated = await _invoiceService.RecordPaymentAsync(id, dto);
        return Ok(updated);
    }
    // DELETE: api/Invoice/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _invoiceService.DeleteAsync(id);
        return NoContent();
    }
}

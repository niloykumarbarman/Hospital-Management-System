using FluentValidation;
using HMS.Application.DTOs.Prescription;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PrescriptionController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;
    private readonly IValidator<CreatePrescriptionDto> _createValidator;
    private readonly IValidator<UpdatePrescriptionDto> _updateValidator;

    public PrescriptionController(
        IPrescriptionService prescriptionService,
        IValidator<CreatePrescriptionDto> createValidator,
        IValidator<UpdatePrescriptionDto> updateValidator)
    {
        _prescriptionService = prescriptionService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // GET: api/Prescription
    [HttpGet]
    [Authorize(Roles = "Admin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetAll()
    {
        var prescriptions = await _prescriptionService.GetAllAsync();
        return Ok(prescriptions);
    }

    // GET: api/Prescription/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var prescription = await _prescriptionService.GetByIdAsync(id);
        if (prescription == null)
        {
            return NotFound(new { message = "Prescription not found." });
        }
        return Ok(prescription);
    }

    // GET: api/Prescription/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Admin,Doctor,Nurse,Pharmacist")]
    public async Task<IActionResult> GetByPatientId(Guid patientId)
    {
        var prescriptions = await _prescriptionService.GetByPatientIdAsync(patientId);
        return Ok(prescriptions);
    }

    // POST: api/Prescription
    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var created = await _prescriptionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/Prescription/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePrescriptionDto dto)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var updated = await _prescriptionService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    // DELETE: api/Prescription/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _prescriptionService.DeleteAsync(id);
        return NoContent();
    }
}

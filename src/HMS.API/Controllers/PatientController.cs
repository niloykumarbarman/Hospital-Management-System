using FluentValidation;
using HMS.Application.DTOs.Patient;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly IValidator<CreatePatientDto> _createValidator;
    private readonly IValidator<UpdatePatientDto> _updateValidator;

    public PatientController(
        IPatientService patientService,
        IValidator<CreatePatientDto> createValidator,
        IValidator<UpdatePatientDto> updateValidator)
    {
        _patientService = patientService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // GET: api/Patient
    [HttpGet]
    [Authorize(Roles = "Admin,Doctor,Receptionist,Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var patients = await _patientService.GetAllAsync();
        return Ok(patients);
    }

    // GET: api/Patient/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Doctor,Receptionist,Nurse")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var patient = await _patientService.GetByIdAsync(id);
        if (patient == null)
        {
            return NotFound(new { message = "Patient not found." });
        }
        return Ok(patient);
    }

    // POST: api/Patient
    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Create([FromBody] CreatePatientDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var created = await _patientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/Patient/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePatientDto dto)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var updated = await _patientService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    // DELETE: api/Patient/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _patientService.DeleteAsync(id);
        return NoContent();
    }
}

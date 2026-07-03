using FluentValidation;
using HMS.Application.DTOs.MedicalRecord;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MedicalRecordController : ControllerBase
{
    private readonly IMedicalRecordService _medicalRecordService;
    private readonly IValidator<CreateMedicalRecordDto> _createValidator;
    private readonly IValidator<UpdateMedicalRecordDto> _updateValidator;

    public MedicalRecordController(
        IMedicalRecordService medicalRecordService,
        IValidator<CreateMedicalRecordDto> createValidator,
        IValidator<UpdateMedicalRecordDto> updateValidator)
    {
        _medicalRecordService = medicalRecordService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // GET: api/MedicalRecord
    [HttpGet]
    [Authorize(Roles = "Admin,Doctor,Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var records = await _medicalRecordService.GetAllAsync();
        return Ok(records);
    }

    // GET: api/MedicalRecord/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Doctor,Nurse")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var record = await _medicalRecordService.GetByIdAsync(id);
        if (record == null)
        {
            return NotFound(new { message = "Medical record not found." });
        }
        return Ok(record);
    }

    // GET: api/MedicalRecord/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Admin,Doctor,Nurse")]
    public async Task<IActionResult> GetByPatientId(Guid patientId)
    {
        var records = await _medicalRecordService.GetByPatientIdAsync(patientId);
        return Ok(records);
    }

    // POST: api/MedicalRecord
    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create([FromBody] CreateMedicalRecordDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var created = await _medicalRecordService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/MedicalRecord/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMedicalRecordDto dto)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var updated = await _medicalRecordService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    // DELETE: api/MedicalRecord/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _medicalRecordService.DeleteAsync(id);
        return NoContent();
    }
}

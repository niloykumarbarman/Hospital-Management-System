using FluentValidation;
using HMS.Application.DTOs.LabTest;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LabTestController : ControllerBase
{
    private readonly ILabTestService _labTestService;
    private readonly IValidator<CreateLabTestDto> _createValidator;
    private readonly IValidator<UpdateLabTestDto> _updateValidator;

    public LabTestController(
        ILabTestService labTestService,
        IValidator<CreateLabTestDto> createValidator,
        IValidator<UpdateLabTestDto> updateValidator)
    {
        _labTestService = labTestService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // GET: api/LabTest
    [HttpGet]
    [Authorize(Roles = "Admin,Doctor,LabTechnician,Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var labTests = await _labTestService.GetAllAsync();
        return Ok(labTests);
    }

    // GET: api/LabTest/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Doctor,LabTechnician,Nurse")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var labTest = await _labTestService.GetByIdAsync(id);
        if (labTest == null)
        {
            return NotFound(new { message = "Lab test not found." });
        }
        return Ok(labTest);
    }

    // GET: api/LabTest/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Admin,Doctor,LabTechnician,Nurse")]
    public async Task<IActionResult> GetByPatientId(Guid patientId)
    {
        var labTests = await _labTestService.GetByPatientIdAsync(patientId);
        return Ok(labTests);
    }

    // POST: api/LabTest
    [HttpPost]
    [Authorize(Roles = "Admin,Doctor,LabTechnician")]
    public async Task<IActionResult> Create([FromBody] CreateLabTestDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var created = await _labTestService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/LabTest/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,LabTechnician")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLabTestDto dto)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }

        var updated = await _labTestService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    // DELETE: api/LabTest/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _labTestService.DeleteAsync(id);
        return NoContent();
    }
}

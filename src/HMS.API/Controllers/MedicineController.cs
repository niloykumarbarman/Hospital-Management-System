using FluentValidation;
using HMS.Application.DTOs.Medicine;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace HMS.API.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MedicineController : ControllerBase
{
    private readonly IMedicineService _medicineService;
    private readonly IValidator<CreateMedicineDto> _createValidator;
    private readonly IValidator<UpdateMedicineDto> _updateValidator;
    public MedicineController(
        IMedicineService medicineService,
        IValidator<CreateMedicineDto> createValidator,
        IValidator<UpdateMedicineDto> updateValidator)
    {
        _medicineService = medicineService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }
    // GET: api/Medicine
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var medicines = await _medicineService.GetAllAsync();
        return Ok(medicines);
    }
    // GET: api/Medicine/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var medicine = await _medicineService.GetByIdAsync(id);
        if (medicine == null)
        {
            return NotFound(new { message = "Medicine not found." });
        }
        return Ok(medicine);
    }
    // GET: api/Medicine/low-stock
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var medicines = await _medicineService.GetLowStockAsync();
        return Ok(medicines);
    }
    // POST: api/Medicine
    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Create([FromBody] CreateMedicineDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }
        var created = await _medicineService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
    // PUT: api/Medicine/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMedicineDto dto)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }
        var updated = await _medicineService.UpdateAsync(id, dto);
        return Ok(updated);
    }
    // DELETE: api/Medicine/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _medicineService.DeleteAsync(id);
        return NoContent();
    }
}

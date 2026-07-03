using System.Security.Claims;
using FluentValidation;
using HMS.Application.DTOs.StockAdjustment;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace HMS.API.Controllers;
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockAdjustmentController : ControllerBase
{
    private readonly IStockAdjustmentService _stockAdjustmentService;
    private readonly IValidator<CreateStockAdjustmentDto> _createValidator;
    public StockAdjustmentController(
        IStockAdjustmentService stockAdjustmentService,
        IValidator<CreateStockAdjustmentDto> createValidator)
    {
        _stockAdjustmentService = stockAdjustmentService;
        _createValidator = createValidator;
    }
    // GET: api/StockAdjustment
    [HttpGet]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> GetAll()
    {
        var adjustments = await _stockAdjustmentService.GetAllAsync();
        return Ok(adjustments);
    }
    // GET: api/StockAdjustment/medicine/{medicineId}
    [HttpGet("medicine/{medicineId}")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> GetByMedicineId(Guid medicineId)
    {
        var adjustments = await _stockAdjustmentService.GetByMedicineIdAsync(medicineId);
        return Ok(adjustments);
    }
    // POST: api/StockAdjustment
    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Create([FromBody] CreateStockAdjustmentDto dto)
    {
        var validationResult = await _createValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
        }
        // Get the current logged-in user's ID from the JWT token (not from the request body)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var adjustedByUserId))
        {
            return Unauthorized(new { message = "Unable to determine current user from token." });
        }
        var created = await _stockAdjustmentService.CreateAsync(dto, adjustedByUserId);
        return CreatedAtAction(nameof(GetByMedicineId), new { medicineId = created.MedicineId }, created);
    }
}

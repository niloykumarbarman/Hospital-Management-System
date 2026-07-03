namespace HMS.Application.DTOs.StockAdjustment;
// AdjustedByUserId is NOT here - it comes from the JWT token (current logged-in user), not the request body
using HMS.Domain.Enums;
public class CreateStockAdjustmentDto
{
    public Guid MedicineId { get; set; }
    public StockAdjustmentType Type { get; set; }
    public int QuantityChanged { get; set; }
    public string? Reason { get; set; }
}

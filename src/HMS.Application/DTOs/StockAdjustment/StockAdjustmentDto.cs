using HMS.Domain.Enums;
namespace HMS.Application.DTOs.StockAdjustment;
public class StockAdjustmentDto
{
    public Guid Id { get; set; }
    public Guid MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public StockAdjustmentType Type { get; set; }
    public int QuantityChanged { get; set; }
    public int StockAfterAdjustment { get; set; }
    public string? Reason { get; set; }
    public Guid AdjustedByUserId { get; set; }
    public string AdjustedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

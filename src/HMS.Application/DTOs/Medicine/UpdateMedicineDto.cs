namespace HMS.Application.DTOs.Medicine;

// DTO used when updating medicine details (does NOT change StockQuantity directly;
// stock changes must go through StockAdjustment for audit trail)
public class UpdateMedicineDto
{
    public string Name { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Manufacturer { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int ReorderLevel { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

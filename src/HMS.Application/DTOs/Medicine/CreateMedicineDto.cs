namespace HMS.Application.DTOs.Medicine;

// DTO used when adding a new medicine to inventory
public class CreateMedicineDto
{
    public string Name { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Manufacturer { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int StockQuantity { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public DateTime? ExpiryDate { get; set; }
}

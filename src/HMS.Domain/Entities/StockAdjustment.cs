using HMS.Domain.Common;
using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

// Audit trail record for every stock in/out adjustment made to a Medicine
public class StockAdjustment : BaseEntity
{
    public Guid MedicineId { get; set; }
    public Medicine Medicine { get; set; } = null!;

    public StockAdjustmentType Type { get; set; }

    // Always a positive number; direction is determined by Type
    public int QuantityChanged { get; set; }

    // Snapshot of Medicine.StockQuantity right after this adjustment was applied
    public int StockAfterAdjustment { get; set; }

    public string? Reason { get; set; }

    public Guid AdjustedByUserId { get; set; }
    public User AdjustedByUser { get; set; } = null!;
}

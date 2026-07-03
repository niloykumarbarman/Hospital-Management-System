using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HMS.Infrastructure.Persistence.Configurations;

public class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
{
    public void Configure(EntityTypeBuilder<StockAdjustment> builder)
    {
        builder.ToTable("StockAdjustments");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Reason)
            .HasMaxLength(500);

        builder.HasOne(s => s.Medicine)
            .WithMany()
            .HasForeignKey(s => s.MedicineId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.AdjustedByUser)
            .WithMany()
            .HasForeignKey(s => s.AdjustedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

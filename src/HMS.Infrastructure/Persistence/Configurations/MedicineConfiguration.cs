using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HMS.Infrastructure.Persistence.Configurations;

public class MedicineConfiguration : IEntityTypeConfiguration<Medicine>
{
    public void Configure(EntityTypeBuilder<Medicine> builder)
    {
        builder.ToTable("Medicines");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.GenericName)
            .HasMaxLength(200);

        builder.Property(m => m.Manufacturer)
            .HasMaxLength(150);

        builder.Property(m => m.Unit)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.UnitPrice)
            .HasColumnType("decimal(10,2)");
    }
}

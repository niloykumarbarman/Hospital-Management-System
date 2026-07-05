using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace HMS.Infrastructure.Persistence.Configurations;
public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToTable("Doctors");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Specialization)
            .IsRequired()
            .HasMaxLength(100);
        builder.Property(d => d.Qualification)
            .HasMaxLength(200);
        builder.Property(d => d.ConsultationFee)
            .HasColumnType("decimal(10,2)");
        builder.HasMany(d => d.Appointments)
            .WithOne(a => a.Doctor)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        // UserId must be unique only among non-soft-deleted doctor profiles,
        // otherwise a soft-deleted profile permanently blocks re-assigning
        // that user to a new Doctor profile.
        builder.HasIndex(d => d.UserId)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
    }
}

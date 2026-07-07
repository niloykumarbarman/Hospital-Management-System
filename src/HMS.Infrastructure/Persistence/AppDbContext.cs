using System.Security.Claims;
using System.Text.Json;
using HMS.Domain.Common;
using HMS.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace HMS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    // Properties that should never be written into audit log JSON (security)
    private static readonly HashSet<string> SensitiveProperties = new()
    {
        "PasswordHash"
    };

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? httpContextAccessor = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<LabTest> LabTests => Set<LabTest>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Global query filter: exclude soft-deleted records automatically
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Doctor>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Patient>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Appointment>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<MedicalRecord>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Prescription>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PrescriptionItem>().HasQueryFilter(e => !e.IsDeleted && !e.Prescription.IsDeleted && !e.Medicine.IsDeleted);
        modelBuilder.Entity<Medicine>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<LabTest>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Invoice>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InvoiceItem>().HasQueryFilter(e => !e.IsDeleted && !e.Invoice.IsDeleted);
        modelBuilder.Entity<StockAdjustment>().HasQueryFilter(e => !e.IsDeleted);

        // Npgsql only accepts DateTime.Kind=Utc for "timestamp with time zone" columns.
        // JSON-deserialized DateTimes (e.g. from API request bodies) come in as Kind=Unspecified,
        // which throws at save time. This converter transparently treats every DateTime/DateTime?
        // property across all entities as UTC, both when writing to and reading from the database.
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
        var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(utcConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableUtcConverter);
                }
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        var auditEntries = BuildAuditEntries();
        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
        }
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        var auditEntries = BuildAuditEntries();
        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
        }
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    // Builds AuditLog rows from the current ChangeTracker snapshot.
    // Must run BEFORE base.SaveChanges(Async), since entity Ids are already
    // assigned client-side (BaseEntity.Id = Guid.NewGuid() default).
    private List<AuditLog> BuildAuditEntries()
    {
        ChangeTracker.DetectChanges();

        var httpContext = _httpContextAccessor?.HttpContext;
        var userIdClaim = httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : null;
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();

        var result = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            // Never audit the AuditLog entity itself (avoid recursion/noise)
            if (entry.Entity is AuditLog)
            {
                continue;
            }

            if (entry.State != EntityState.Added &&
                entry.State != EntityState.Modified &&
                entry.State != EntityState.Deleted)
            {
                continue;
            }

            string action;
            string? oldValues = null;
            string? newValues = null;

            if (entry.State == EntityState.Added)
            {
                action = "Create";
                newValues = SerializeAllProperties(entry, useCurrentValues: true);
            }
            else if (entry.State == EntityState.Deleted)
            {
                action = "Delete";
                oldValues = SerializeAllProperties(entry, useCurrentValues: false);
            }
            else
            {
                // Modified. Detect soft-delete: IsDeleted flips false -> true.
                var isDeletedProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "IsDeleted");
                var isSoftDelete = isDeletedProp is { OriginalValue: bool originalDeleted, CurrentValue: bool currentDeleted }
                                    && !originalDeleted && currentDeleted;

                action = isSoftDelete ? "Delete" : "Update";

                var oldDict = new Dictionary<string, object?>();
                var newDict = new Dictionary<string, object?>();

                foreach (var prop in entry.Properties)
                {
                    if (!prop.IsModified || SensitiveProperties.Contains(prop.Metadata.Name))
                    {
                        continue;
                    }

                    oldDict[prop.Metadata.Name] = prop.OriginalValue;
                    newDict[prop.Metadata.Name] = prop.CurrentValue;
                }

                if (oldDict.Count == 0)
                {
                    // Nothing meaningfully changed (e.g. only a nav-collection touch); skip.
                    continue;
                }

                oldValues = JsonSerializer.Serialize(oldDict);
                newValues = JsonSerializer.Serialize(newDict);
            }

            result.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entry.Entity.GetType().Name,
                EntityId = entry.Entity.Id.ToString(),
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = ipAddress
            });
        }

        return result;
    }

    private static string SerializeAllProperties(EntityEntry entry, bool useCurrentValues)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var prop in entry.Properties)
        {
            if (SensitiveProperties.Contains(prop.Metadata.Name))
            {
                continue;
            }
            dict[prop.Metadata.Name] = useCurrentValues ? prop.CurrentValue : prop.OriginalValue;
        }
        return JsonSerializer.Serialize(dict);
    }
}

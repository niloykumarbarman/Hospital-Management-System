using HMS.Domain.Entities;

namespace HMS.Domain.Interfaces;

// Appointment-specific repository to eager-load Patient and Doctor (with User) details
public interface IAppointmentRepository : IGenericRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetAllWithDetailsAsync();
    Task<Appointment?> GetByIdWithDetailsAsync(Guid id);
    Task<bool> HasConflictAsync(Guid doctorId, DateTime appointmentDate, TimeSpan appointmentTime, Guid? excludeAppointmentId = null);
}

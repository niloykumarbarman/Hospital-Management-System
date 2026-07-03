using HMS.Domain.Enums;

namespace HMS.Application.DTOs.Appointment;

// DTO returned to client when reading appointment data (flattens Patient and Doctor names)
public class AppointmentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? ReasonForVisit { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

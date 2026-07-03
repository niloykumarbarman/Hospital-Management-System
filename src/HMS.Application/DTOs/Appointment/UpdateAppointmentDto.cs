using HMS.Domain.Enums;

namespace HMS.Application.DTOs.Appointment;

// DTO used when updating an appointment (reschedule, change status, or add notes)
public class UpdateAppointmentDto
{
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? ReasonForVisit { get; set; }
    public string? Notes { get; set; }
}

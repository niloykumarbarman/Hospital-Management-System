namespace HMS.Application.DTOs.Appointment;

// DTO used when booking a new appointment (Status defaults to Pending in the entity)
public class CreateAppointmentDto
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string? ReasonForVisit { get; set; }
}

namespace HMS.Application.DTOs.Report;
// Optional date range filter for Appointment Excel export.
// If both are null, all appointments are exported.
public class AppointmentReportFilterDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

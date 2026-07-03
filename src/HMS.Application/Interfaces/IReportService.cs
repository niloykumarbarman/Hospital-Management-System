using HMS.Application.DTOs.Report;
namespace HMS.Application.Interfaces;
public interface IReportService
{
    // Generates a printable PDF receipt for a single invoice
    Task<byte[]> GenerateInvoicePdfAsync(Guid invoiceId);

    // Exports the full patient list as an Excel workbook
    Task<byte[]> GeneratePatientListExcelAsync();

    // Exports appointments (optionally filtered by date range) as an Excel workbook
    Task<byte[]> GenerateAppointmentListExcelAsync(AppointmentReportFilterDto filter);

    // Generates a combined PDF medical history report for a patient
    // (Medical Records + Prescriptions + Lab Tests)
    Task<byte[]> GeneratePatientMedicalReportPdfAsync(Guid patientId);
}

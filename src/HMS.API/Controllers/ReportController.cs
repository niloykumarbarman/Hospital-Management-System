using HMS.Application.DTOs.Report;
using HMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace HMS.API.Controllers;
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;
    private const string PdfContentType = "application/pdf";
    private const string ExcelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    // GET: api/Report/invoice/{invoiceId}/pdf
    [HttpGet("invoice/{invoiceId}/pdf")]
    public async Task<IActionResult> GetInvoicePdf(Guid invoiceId)
    {
        var pdfBytes = await _reportService.GenerateInvoicePdfAsync(invoiceId);
        return File(pdfBytes, PdfContentType, $"Invoice_{invoiceId}.pdf");
    }

    // GET: api/Report/patients/excel
    [HttpGet("patients/excel")]
    public async Task<IActionResult> GetPatientListExcel()
    {
        var excelBytes = await _reportService.GeneratePatientListExcelAsync();
        return File(excelBytes, ExcelContentType, "PatientList.xlsx");
    }

    // GET: api/Report/appointments/excel?startDate=...&endDate=...
    [HttpGet("appointments/excel")]
    public async Task<IActionResult> GetAppointmentListExcel([FromQuery] AppointmentReportFilterDto filter)
    {
        var excelBytes = await _reportService.GenerateAppointmentListExcelAsync(filter);
        return File(excelBytes, ExcelContentType, "AppointmentList.xlsx");
    }

    // GET: api/Report/patient/{patientId}/medical-history/pdf
    [HttpGet("patient/{patientId}/medical-history/pdf")]
    public async Task<IActionResult> GetPatientMedicalReportPdf(Guid patientId)
    {
        var pdfBytes = await _reportService.GeneratePatientMedicalReportPdfAsync(patientId);
        return File(pdfBytes, PdfContentType, $"MedicalHistory_{patientId}.pdf");
    }
}

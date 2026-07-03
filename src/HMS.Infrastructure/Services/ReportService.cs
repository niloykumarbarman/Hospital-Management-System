using ClosedXML.Excel;
using HMS.Application.DTOs.Report;
using HMS.Application.Interfaces;
using HMS.Domain.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
namespace HMS.Infrastructure.Services;
public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;
    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // ---------- Invoice PDF ----------
    public async Task<byte[]> GenerateInvoicePdfAsync(Guid invoiceId)
    {
        var invoice = await _unitOfWork.InvoiceRepository.GetByIdWithDetailsAsync(invoiceId);
        if (invoice == null)
        {
            throw new KeyNotFoundException("Invoice not found.");
        }

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("Hospital Management System").FontSize(18).Bold();
                    col.Item().Text("Invoice Receipt").FontSize(12).FontColor(Colors.Grey.Darken2);
                    col.Item().PaddingTop(5).LineHorizontal(1);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(8);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Invoice No: {invoice.InvoiceNumber}").Bold();
                            c.Item().Text($"Date: {invoice.InvoiceDate:yyyy-MM-dd}");
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text($"Patient: {invoice.Patient.FullName}").Bold();
                            c.Item().Text($"Patient Code: {invoice.Patient.PatientCode}");
                        });
                    });

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("Description").Bold();
                            header.Cell().Text("Qty").Bold();
                            header.Cell().Text("Unit Price").Bold();
                            header.Cell().Text("SubTotal").Bold();
                            header.Cell().ColumnSpan(4).PaddingTop(3).LineHorizontal(1);
                        });

                        foreach (var item in invoice.Items)
                        {
                            table.Cell().Text(item.Description);
                            table.Cell().Text(item.Quantity.ToString());
                            table.Cell().Text(item.UnitPrice.ToString("F2"));
                            table.Cell().Text(item.SubTotal.ToString("F2"));
                        }
                    });

                    col.Item().PaddingTop(10).AlignRight().Column(c =>
                    {
                        c.Item().Text($"Total Amount: {invoice.TotalAmount:F2}").Bold();
                        c.Item().Text($"Paid Amount: {invoice.PaidAmount:F2}");
                        c.Item().Text($"Due Amount: {invoice.DueAmount:F2}").Bold();
                        c.Item().Text($"Payment Status: {invoice.PaymentStatus}").Bold();
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated on ").FontSize(9).FontColor(Colors.Grey.Darken1);
                    x.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            });
        });

        return document.GeneratePdf();
    }

    // ---------- Patient List Excel ----------
    public async Task<byte[]> GeneratePatientListExcelAsync()
    {
        var patients = await _unitOfWork.PatientRepository.GetAllAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Patients");

        var headers = new[] { "Patient Code", "Full Name", "Gender", "Date of Birth", "Phone", "Email", "Address", "Blood Group" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        int row = 2;
        foreach (var p in patients)
        {
            worksheet.Cell(row, 1).Value = p.PatientCode;
            worksheet.Cell(row, 2).Value = p.FullName;
            worksheet.Cell(row, 3).Value = p.Gender.ToString();
            worksheet.Cell(row, 4).Value = p.DateOfBirth.ToString("yyyy-MM-dd");
            worksheet.Cell(row, 5).Value = p.PhoneNumber ?? "";
            worksheet.Cell(row, 6).Value = p.Email ?? "";
            worksheet.Cell(row, 7).Value = p.Address ?? "";
            worksheet.Cell(row, 8).Value = p.BloodGroup ?? "";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    // ---------- Appointment List Excel ----------
    public async Task<byte[]> GenerateAppointmentListExcelAsync(AppointmentReportFilterDto filter)
    {
        var appointments = await _unitOfWork.AppointmentRepository.GetAllWithDetailsAsync();

        var filtered = appointments.AsEnumerable();
        if (filter.StartDate.HasValue)
        {
            filtered = filtered.Where(a => a.AppointmentDate.Date >= filter.StartDate.Value.Date);
        }
        if (filter.EndDate.HasValue)
        {
            filtered = filtered.Where(a => a.AppointmentDate.Date <= filter.EndDate.Value.Date);
        }

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Appointments");

        var headers = new[] { "Patient", "Doctor", "Date", "Time", "Status", "Reason" };
        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        int row = 2;
        foreach (var a in filtered.OrderBy(a => a.AppointmentDate))
        {
            worksheet.Cell(row, 1).Value = a.Patient.FullName;
            worksheet.Cell(row, 2).Value = a.Doctor.User.FullName;
            worksheet.Cell(row, 3).Value = a.AppointmentDate.ToString("yyyy-MM-dd");
            worksheet.Cell(row, 4).Value = a.AppointmentTime.ToString(@"hh\:mm");
            worksheet.Cell(row, 5).Value = a.Status.ToString();
            worksheet.Cell(row, 6).Value = a.ReasonForVisit ?? "";
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    // ---------- Patient Medical Report PDF ----------
    public async Task<byte[]> GeneratePatientMedicalReportPdfAsync(Guid patientId)
    {
        var patient = await _unitOfWork.PatientRepository.GetByIdAsync(patientId);
        if (patient == null)
        {
            throw new KeyNotFoundException("Patient not found.");
        }

        var medicalRecords = await _unitOfWork.MedicalRecordRepository.GetByPatientIdAsync(patientId);
        var prescriptions = await _unitOfWork.PrescriptionRepository.GetByPatientIdAsync(patientId);
        var labTests = await _unitOfWork.LabTestRepository.GetByPatientIdAsync(patientId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("Hospital Management System").FontSize(18).Bold();
                    col.Item().Text("Patient Medical History Report").FontSize(12).FontColor(Colors.Grey.Darken2);
                    col.Item().PaddingTop(3).Text($"Patient: {patient.FullName} ({patient.PatientCode})").Bold();
                    col.Item().PaddingTop(5).LineHorizontal(1);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Text("Medical Records").FontSize(13).Bold();
                    if (!medicalRecords.Any())
                    {
                        col.Item().Text("No medical records found.").FontColor(Colors.Grey.Darken1);
                    }
                    foreach (var mr in medicalRecords.OrderByDescending(m => m.VisitDate))
                    {
                        col.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(c =>
                        {
                            c.Item().Text($"Visit Date: {mr.VisitDate:yyyy-MM-dd}  |  Doctor: {mr.Doctor.User.FullName}").Bold();
                            c.Item().Text($"Admission Type: {mr.AdmissionType}");
                            if (!string.IsNullOrWhiteSpace(mr.ChiefComplaint)) c.Item().Text($"Chief Complaint: {mr.ChiefComplaint}");
                            if (!string.IsNullOrWhiteSpace(mr.Diagnosis)) c.Item().Text($"Diagnosis: {mr.Diagnosis}");
                            if (!string.IsNullOrWhiteSpace(mr.TreatmentPlan)) c.Item().Text($"Treatment Plan: {mr.TreatmentPlan}");
                        });
                    }

                    col.Item().PaddingTop(10).Text("Prescriptions").FontSize(13).Bold();
                    if (!prescriptions.Any())
                    {
                        col.Item().Text("No prescriptions found.").FontColor(Colors.Grey.Darken1);
                    }
                    foreach (var pr in prescriptions.OrderByDescending(p => p.PrescriptionDate))
                    {
                        col.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(c =>
                        {
                            c.Item().Text($"Date: {pr.PrescriptionDate:yyyy-MM-dd}  |  Doctor: {pr.Doctor.User.FullName}").Bold();
                            foreach (var item in pr.Items)
                            {
                                c.Item().Text($"- {item.Medicine.Name}: {item.Dosage}, {item.Frequency}, {item.DurationInDays} days");
                            }
                        });
                    }

                    col.Item().PaddingTop(10).Text("Lab Tests").FontSize(13).Bold();
                    if (!labTests.Any())
                    {
                        col.Item().Text("No lab tests found.").FontColor(Colors.Grey.Darken1);
                    }
                    foreach (var lt in labTests.OrderByDescending(l => l.RequestedDate))
                    {
                        col.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(c =>
                        {
                            c.Item().Text($"{lt.TestName} ({lt.TestType})  |  Requested: {lt.RequestedDate:yyyy-MM-dd}").Bold();
                            c.Item().Text($"Status: {(lt.IsCompleted ? "Completed" : "Pending")}");
                            if (!string.IsNullOrWhiteSpace(lt.ResultValue)) c.Item().Text($"Result: {lt.ResultValue} (Normal Range: {lt.NormalRange})");
                        });
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated on ").FontSize(9).FontColor(Colors.Grey.Darken1);
                    x.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            });
        });

        return document.GeneratePdf();
    }
}

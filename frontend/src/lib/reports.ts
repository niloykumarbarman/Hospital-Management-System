import api from "./api";

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string): Promise<void> {
  const res = await api.get(`/report/invoice/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  triggerDownload(res.data, `Invoice_${invoiceNumber}.pdf`);
}

export async function downloadPatientListExcel(): Promise<void> {
  const res = await api.get("/report/patients/excel", {
    responseType: "blob",
  });
  triggerDownload(res.data, "PatientList.xlsx");
}

export async function downloadAppointmentListExcel(
  startDate?: string,
  endDate?: string
): Promise<void> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get("/report/appointments/excel", {
    params,
    responseType: "blob",
  });
  triggerDownload(res.data, "AppointmentList.xlsx");
}

export async function downloadPatientMedicalHistoryPdf(
  patientId: string,
  patientName: string
): Promise<void> {
  const res = await api.get(`/report/patient/${patientId}/medical-history/pdf`, {
    responseType: "blob",
  });
  triggerDownload(res.data, `MedicalHistory_${patientName.replace(/\s+/g, "_")}.pdf`);
}

import api from "./api";
import type { InvoiceDto, CreateInvoiceDto, RecordPaymentDto } from "@/types/invoice";

export async function getInvoices(): Promise<InvoiceDto[]> {
  const res = await api.get<InvoiceDto[]>("/invoice");
  return res.data;
}

export async function getInvoice(id: string): Promise<InvoiceDto> {
  const res = await api.get<InvoiceDto>(`/invoice/${id}`);
  return res.data;
}

export async function getInvoicesByPatient(patientId: string): Promise<InvoiceDto[]> {
  const res = await api.get<InvoiceDto[]>(`/invoice/patient/${patientId}`);
  return res.data;
}

export async function createInvoice(dto: CreateInvoiceDto): Promise<InvoiceDto> {
  const res = await api.post<InvoiceDto>("/invoice", dto);
  return res.data;
}

export async function recordPayment(id: string, dto: RecordPaymentDto): Promise<InvoiceDto> {
  const res = await api.post<InvoiceDto>(`/invoice/${id}/payment`, dto);
  return res.data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoice/${id}`);
}

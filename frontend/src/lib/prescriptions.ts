import api from "./api";
import type {
  PrescriptionDto,
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
} from "@/types/prescription";

export async function getPrescriptions(): Promise<PrescriptionDto[]> {
  const res = await api.get<PrescriptionDto[]>("/prescription");
  return res.data;
}

export async function getPrescription(id: string): Promise<PrescriptionDto> {
  const res = await api.get<PrescriptionDto>(`/prescription/${id}`);
  return res.data;
}

export async function getPrescriptionsByPatient(
  patientId: string
): Promise<PrescriptionDto[]> {
  const res = await api.get<PrescriptionDto[]>(
    `/prescription/patient/${patientId}`
  );
  return res.data;
}

export async function createPrescription(
  dto: CreatePrescriptionDto
): Promise<PrescriptionDto> {
  const res = await api.post<PrescriptionDto>("/prescription", dto);
  return res.data;
}

export async function updatePrescription(
  id: string,
  dto: UpdatePrescriptionDto
): Promise<PrescriptionDto> {
  const res = await api.put<PrescriptionDto>(`/prescription/${id}`, dto);
  return res.data;
}

export async function deletePrescription(id: string): Promise<void> {
  await api.delete(`/prescription/${id}`);
}

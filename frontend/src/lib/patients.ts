import api from "./api";
import type { PatientDto, CreatePatientDto, UpdatePatientDto } from "@/types/patient";

export async function getPatients(): Promise<PatientDto[]> {
  const res = await api.get<PatientDto[]>("/patient");
  return res.data;
}

export async function getPatient(id: string): Promise<PatientDto> {
  const res = await api.get<PatientDto>(`/patient/${id}`);
  return res.data;
}

export async function createPatient(dto: CreatePatientDto): Promise<PatientDto> {
  const res = await api.post<PatientDto>("/patient", dto);
  return res.data;
}

export async function updatePatient(id: string, dto: UpdatePatientDto): Promise<PatientDto> {
  const res = await api.put<PatientDto>(`/patient/${id}`, dto);
  return res.data;
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patient/${id}`);
}

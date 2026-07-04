import api from "./api";
import type {
  MedicalRecordDto,
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
} from "@/types/medicalRecord";

export async function getMedicalRecords(): Promise<MedicalRecordDto[]> {
  const res = await api.get<MedicalRecordDto[]>("/medicalrecord");
  return res.data;
}

export async function getMedicalRecord(id: string): Promise<MedicalRecordDto> {
  const res = await api.get<MedicalRecordDto>(`/medicalrecord/${id}`);
  return res.data;
}

export async function getMedicalRecordsByPatient(
  patientId: string
): Promise<MedicalRecordDto[]> {
  const res = await api.get<MedicalRecordDto[]>(
    `/medicalrecord/patient/${patientId}`
  );
  return res.data;
}

export async function createMedicalRecord(
  dto: CreateMedicalRecordDto
): Promise<MedicalRecordDto> {
  const res = await api.post<MedicalRecordDto>("/medicalrecord", dto);
  return res.data;
}

export async function updateMedicalRecord(
  id: string,
  dto: UpdateMedicalRecordDto
): Promise<MedicalRecordDto> {
  const res = await api.put<MedicalRecordDto>(`/medicalrecord/${id}`, dto);
  return res.data;
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  await api.delete(`/medicalrecord/${id}`);
}

import api from "./api";
import type { LabTestDto, CreateLabTestDto, UpdateLabTestDto } from "@/types/labTest";

export async function getLabTests(): Promise<LabTestDto[]> {
  const res = await api.get<LabTestDto[]>("/labtest");
  return res.data;
}

export async function getLabTest(id: string): Promise<LabTestDto> {
  const res = await api.get<LabTestDto>(`/labtest/${id}`);
  return res.data;
}

export async function getLabTestsByPatient(patientId: string): Promise<LabTestDto[]> {
  const res = await api.get<LabTestDto[]>(`/labtest/patient/${patientId}`);
  return res.data;
}

export async function createLabTest(dto: CreateLabTestDto): Promise<LabTestDto> {
  const res = await api.post<LabTestDto>("/labtest", dto);
  return res.data;
}

export async function updateLabTest(id: string, dto: UpdateLabTestDto): Promise<LabTestDto> {
  const res = await api.put<LabTestDto>(`/labtest/${id}`, dto);
  return res.data;
}

export async function deleteLabTest(id: string): Promise<void> {
  await api.delete(`/labtest/${id}`);
}

import api from "./api";
import type { DoctorDto, CreateDoctorDto, UpdateDoctorDto } from "@/types/doctor";

export async function getDoctors(): Promise<DoctorDto[]> {
  const res = await api.get<DoctorDto[]>("/doctor");
  return res.data;
}

export async function getDoctor(id: string): Promise<DoctorDto> {
  const res = await api.get<DoctorDto>(`/doctor/${id}`);
  return res.data;
}

export async function createDoctor(dto: CreateDoctorDto): Promise<DoctorDto> {
  const res = await api.post<DoctorDto>("/doctor", dto);
  return res.data;
}

export async function updateDoctor(id: string, dto: UpdateDoctorDto): Promise<DoctorDto> {
  const res = await api.put<DoctorDto>(`/doctor/${id}`, dto);
  return res.data;
}

export async function deleteDoctor(id: string): Promise<void> {
  await api.delete(`/doctor/${id}`);
}

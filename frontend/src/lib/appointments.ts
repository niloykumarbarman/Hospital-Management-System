import api from "./api";
import type {
  AppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/types/appointment";

export async function getAppointments(): Promise<AppointmentDto[]> {
  const res = await api.get<AppointmentDto[]>("/appointment");
  return res.data;
}

export async function getAppointment(id: string): Promise<AppointmentDto> {
  const res = await api.get<AppointmentDto>(`/appointment/${id}`);
  return res.data;
}

export async function createAppointment(
  data: CreateAppointmentDto
): Promise<AppointmentDto> {
  const res = await api.post<AppointmentDto>("/appointment", data);
  return res.data;
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentDto
): Promise<AppointmentDto> {
  const res = await api.put<AppointmentDto>(`/appointment/${id}`, data);
  return res.data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointment/${id}`);
}

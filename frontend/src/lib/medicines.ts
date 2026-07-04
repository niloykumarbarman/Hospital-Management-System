import api from "./api";
import type { MedicineDto, CreateMedicineDto, UpdateMedicineDto } from "@/types/medicine";

export async function getMedicines(): Promise<MedicineDto[]> {
  const res = await api.get<MedicineDto[]>("/medicine");
  return res.data;
}

export async function getMedicine(id: string): Promise<MedicineDto> {
  const res = await api.get<MedicineDto>(`/medicine/${id}`);
  return res.data;
}

export async function getLowStockMedicines(): Promise<MedicineDto[]> {
  const res = await api.get<MedicineDto[]>("/medicine/low-stock");
  return res.data;
}

export async function createMedicine(dto: CreateMedicineDto): Promise<MedicineDto> {
  const res = await api.post<MedicineDto>("/medicine", dto);
  return res.data;
}

export async function updateMedicine(id: string, dto: UpdateMedicineDto): Promise<MedicineDto> {
  const res = await api.put<MedicineDto>(`/medicine/${id}`, dto);
  return res.data;
}

export async function deleteMedicine(id: string): Promise<void> {
  await api.delete(`/medicine/${id}`);
}

import api from "./api";
import type { BackupFileDto } from "@/types/backup";

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

export async function getBackups(): Promise<BackupFileDto[]> {
  const res = await api.get<BackupFileDto[]>("/backup");
  return res.data;
}

export async function createBackup(): Promise<BackupFileDto> {
  const res = await api.post<BackupFileDto>("/backup");
  return res.data;
}

export async function downloadBackup(fileName: string): Promise<void> {
  const res = await api.get(`/backup/${fileName}/download`, {
    responseType: "blob",
  });
  triggerDownload(res.data, fileName);
}

export async function restoreBackup(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await api.post("/backup/restore", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteBackup(fileName: string): Promise<void> {
  await api.delete(`/backup/${fileName}`);
}

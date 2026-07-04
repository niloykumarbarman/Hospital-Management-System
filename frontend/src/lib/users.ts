import api from "./api";
import type { UserDto } from "@/types/user";

export async function getUsers(
  role?: string,
  onlyUnassignedDoctors?: boolean
): Promise<UserDto[]> {
  const res = await api.get<UserDto[]>("/User", {
    params: {
      role,
      onlyUnassignedDoctors,
    },
  });
  return res.data;
}

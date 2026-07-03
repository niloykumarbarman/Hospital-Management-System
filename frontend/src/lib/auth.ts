import Cookies from "js-cookie";
import { AuthResponse, AuthUser } from "@/types/auth";

const TOKEN_KEY = "hms_token";
const USER_KEY = "hms_user";

export function saveAuth(data: AuthResponse) {
  Cookies.set(TOKEN_KEY, data.token, {
    expires: new Date(data.expiresAt),
    sameSite: "lax",
    path: "/",
  });
  const user: AuthUser = {
    fullName: data.fullName,
    email: data.email,
    role: data.role,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function clearAuth() {
  Cookies.remove(TOKEN_KEY, { path: "/" });
  localStorage.removeItem(USER_KEY);
}

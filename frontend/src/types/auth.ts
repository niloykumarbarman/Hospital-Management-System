export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
}

export interface AuthUser {
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: number;
}

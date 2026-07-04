export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
  hasDoctorProfile: boolean;
}

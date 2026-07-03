export interface DoctorDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  specialization: string;
  qualification: string;
  licenseNumber: string | null;
  consultationFee: number;
  experienceYears: number;
  createdAt: string;
}

export interface CreateDoctorDto {
  userId: string;
  specialization: string;
  qualification: string;
  licenseNumber?: string;
  consultationFee: number;
  experienceYears: number;
}

export interface UpdateDoctorDto {
  specialization: string;
  qualification: string;
  licenseNumber?: string;
  consultationFee: number;
  experienceYears: number;
}

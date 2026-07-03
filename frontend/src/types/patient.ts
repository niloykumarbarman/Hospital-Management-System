export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
}

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.Male]: "Male",
  [Gender.Female]: "Female",
  [Gender.Other]: "Other",
};

export interface PatientDto {
  id: string;
  patientCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
}

export interface CreatePatientDto {
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export type UpdatePatientDto = CreatePatientDto;

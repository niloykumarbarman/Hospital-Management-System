export interface PrescriptionItemDto {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationInDays: number;
  instructions: string | null;
}

export interface CreatePrescriptionItemDto {
  medicineId: string;
  dosage: string;
  frequency: string;
  durationInDays: number;
  instructions?: string;
}

export interface PrescriptionDto {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  medicalRecordId: string | null;
  prescriptionDate: string;
  notes: string | null;
  items: PrescriptionItemDto[];
  createdAt: string;
}

export interface CreatePrescriptionDto {
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  prescriptionDate: string;
  notes?: string;
  items: CreatePrescriptionItemDto[];
}

export interface UpdatePrescriptionDto {
  prescriptionDate: string;
  notes?: string;
  items: CreatePrescriptionItemDto[];
}

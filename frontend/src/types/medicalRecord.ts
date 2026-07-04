export enum AdmissionType {
  OPD = 1,
  IPD = 2,
}

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  [AdmissionType.OPD]: "OPD",
  [AdmissionType.IPD]: "IPD",
};

export interface MedicalRecordDto {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  admissionType: AdmissionType;
  visitDate: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  vitalSigns: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  doctorId: string;
  admissionType: AdmissionType;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  vitalSigns?: string;
  notes?: string;
}

export interface UpdateMedicalRecordDto {
  admissionType: AdmissionType;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  vitalSigns?: string;
  notes?: string;
}

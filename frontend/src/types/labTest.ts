export interface LabTestDto {
  id: string;
  patientId: string;
  patientName: string;
  medicalRecordId: string | null;
  testName: string;
  testType: string | null;
  requestedDate: string;
  resultDate: string | null;
  resultValue: string | null;
  normalRange: string | null;
  remarks: string | null;
  isCompleted: boolean;
  createdAt: string;
}

export interface CreateLabTestDto {
  patientId: string;
  medicalRecordId?: string;
  testName: string;
  testType?: string;
  requestedDate: string;
}

export interface UpdateLabTestDto {
  testName: string;
  testType?: string;
  requestedDate: string;
  resultDate?: string;
  resultValue?: string;
  normalRange?: string;
  remarks?: string;
  isCompleted: boolean;
}

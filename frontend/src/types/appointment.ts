export enum AppointmentStatus {
  Pending = 1,
  Confirmed = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
  NoShow = 6,
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]: "Pending",
  [AppointmentStatus.Confirmed]: "Confirmed",
  [AppointmentStatus.InProgress]: "In Progress",
  [AppointmentStatus.Completed]: "Completed",
  [AppointmentStatus.Cancelled]: "Cancelled",
  [AppointmentStatus.NoShow]: "No Show",
};

export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reasonForVisit: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit?: string;
}

export interface UpdateAppointmentDto {
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  notes?: string;
}

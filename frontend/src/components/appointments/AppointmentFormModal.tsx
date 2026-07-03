"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import {
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  AppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "@/types/appointment";
import { PatientDto } from "@/types/patient";
import { DoctorDto } from "@/types/doctor";
import { createAppointment, updateAppointment } from "@/lib/appointments";
import { getPatients } from "@/lib/patients";
import { getDoctors } from "@/lib/doctors";

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (appointment: AppointmentDto) => void;
  appointment?: AppointmentDto | null;
}

const emptyForm = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  reasonForVisit: "",
  status: AppointmentStatus.Pending,
  notes: "",
};

type FormState = typeof emptyForm;

export default function AppointmentFormModal({
  open,
  onClose,
  onSaved,
  appointment,
}: AppointmentFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const isEdit = !!appointment;

  useEffect(() => {
    if (!open) return;
    setLoadingLists(true);
    Promise.all([getPatients(), getDoctors()])
      .then(([p, d]) => {
        setPatients(p);
        setDoctors(d);
      })
      .catch(() => {
        setApiError("Failed to load patients/doctors list.");
      })
      .finally(() => setLoadingLists(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (appointment) {
      setForm({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate.slice(0, 10),
        appointmentTime: appointment.appointmentTime.slice(0, 5),
        reasonForVisit: appointment.reasonForVisit ?? "",
        status: appointment.status,
        notes: appointment.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setApiError(null);
  }, [open, appointment]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.patientId) next.patientId = "Patient is required.";
    if (!form.doctorId) next.doctorId = "Doctor is required.";
    if (!form.appointmentDate) next.appointmentDate = "Date is required.";
    else if (!isEdit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.appointmentDate) < today)
        next.appointmentDate = "Date cannot be in the past.";
    }
    if (!form.appointmentTime) next.appointmentTime = "Time is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const time = form.appointmentTime.length === 5
        ? `${form.appointmentTime}:00`
        : form.appointmentTime;

      let saved: AppointmentDto;
      if (isEdit) {
        const payload: UpdateAppointmentDto = {
          appointmentDate: form.appointmentDate,
          appointmentTime: time,
          status: form.status,
          reasonForVisit: form.reasonForVisit || undefined,
          notes: form.notes || undefined,
        };
        saved = await updateAppointment(appointment!.id, payload);
      } else {
        const payload: CreateAppointmentDto = {
          patientId: form.patientId,
          doctorId: form.doctorId,
          appointmentDate: form.appointmentDate,
          appointmentTime: time,
          reasonForVisit: form.reasonForVisit || undefined,
        };
        saved = await createAppointment(payload);
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (Array.isArray(data)) setApiError(data.join(" "));
      else if (data?.message) setApiError(data.message);
      else setApiError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Appointment" : "Book Appointment"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isEdit ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] px-3 py-2 text-sm">
            <p className="text-[var(--foreground)] font-medium">
              {appointment!.patientName}
            </p>
            <p className="text-[var(--foreground-muted)]">
              with {appointment!.doctorName} ({appointment!.specialization})
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              error={errors.patientId}
              disabled={loadingLists}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.patientCode})
                </option>
              ))}
            </Select>

            <Select
              label="Doctor"
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              error={errors.doctorId}
              disabled={loadingLists}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialization})
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            error={errors.appointmentDate}
          />
          <Input
            label="Time"
            type="time"
            value={form.appointmentTime}
            onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
            error={errors.appointmentTime}
          />
        </div>

        {isEdit && (
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: Number(e.target.value) as AppointmentStatus })
            }
          >
            {Object.values(AppointmentStatus)
              .filter((v) => typeof v === "number")
              .map((v) => (
                <option key={v} value={v}>
                  {APPOINTMENT_STATUS_LABELS[v as AppointmentStatus]}
                </option>
              ))}
          </Select>
        )}

        <Textarea
          label="Reason for Visit"
          value={form.reasonForVisit}
          onChange={(e) => setForm({ ...form, reasonForVisit: e.target.value })}
          placeholder="e.g. Routine checkup"
        />

        {isEdit && (
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Doctor's notes"
          />
        )}

        {apiError && (
          <p className="text-sm text-[var(--danger)]">{apiError}</p>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Book Appointment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

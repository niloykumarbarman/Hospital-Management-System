"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import {
  MedicalRecordDto,
  CreateMedicalRecordDto,
  AdmissionType,
  ADMISSION_TYPE_LABELS,
} from "@/types/medicalRecord";
import { PatientDto } from "@/types/patient";
import { DoctorDto } from "@/types/doctor";
import { createMedicalRecord, updateMedicalRecord } from "@/lib/medicalRecords";
import { getPatients } from "@/lib/patients";
import { getDoctors } from "@/lib/doctors";

interface MedicalRecordFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (record: MedicalRecordDto) => void;
  record?: MedicalRecordDto | null;
}

function toDateTimeLocal(value: string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function emptyForm(): CreateMedicalRecordDto {
  return {
    patientId: "",
    doctorId: "",
    admissionType: AdmissionType.OPD,
    visitDate: toDateTimeLocal(new Date().toISOString()),
    chiefComplaint: "",
    diagnosis: "",
    treatmentPlan: "",
    vitalSigns: "",
    notes: "",
  };
}

export default function MedicalRecordFormModal({
  open,
  onClose,
  onSaved,
  record,
}: MedicalRecordFormModalProps) {
  const [form, setForm] = useState<CreateMedicalRecordDto>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const isEdit = !!record;

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        patientId: record.patientId,
        doctorId: record.doctorId,
        admissionType: record.admissionType,
        visitDate: toDateTimeLocal(record.visitDate),
        chiefComplaint: record.chiefComplaint ?? "",
        diagnosis: record.diagnosis ?? "",
        treatmentPlan: record.treatmentPlan ?? "",
        vitalSigns: record.vitalSigns ?? "",
        notes: record.notes ?? "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setApiError(null);
  }, [open, record]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError(null);
    Promise.all([getPatients(), getDoctors()])
      .then(([p, d]) => {
        if (!cancelled) {
          setPatients(p);
          setDoctors(d);
        }
      })
      .catch(() => {
        if (!cancelled)
          setOptionsError("Failed to load patients/doctors. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.patientId) next.patientId = "Please select a patient.";
    if (!form.doctorId) next.doctorId = "Please select a doctor.";
    if (!form.visitDate) next.visitDate = "Visit date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        visitDate: new Date(form.visitDate).toISOString(),
        chiefComplaint: form.chiefComplaint || undefined,
        diagnosis: form.diagnosis || undefined,
        treatmentPlan: form.treatmentPlan || undefined,
        vitalSigns: form.vitalSigns || undefined,
        notes: form.notes || undefined,
      };
      const saved = isEdit
        ? await updateMedicalRecord(record!.id, payload)
        : await createMedicalRecord(payload);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (Array.isArray(data)) setApiError(data.join(" "));
      else setApiError(data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Medical Record" : "Add Medical Record"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            error={errors.patientId || optionsError || undefined}
            disabled={optionsLoading || isEdit}
          >
            <option value="">
              {optionsLoading ? "Loading patients..." : "Select a patient"}
            </option>
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
            error={errors.doctorId || undefined}
            disabled={optionsLoading}
          >
            <option value="">
              {optionsLoading ? "Loading doctors..." : "Select a doctor"}
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.specialization})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Admission Type"
            value={form.admissionType}
            onChange={(e) =>
              setForm({ ...form, admissionType: Number(e.target.value) as AdmissionType })
            }
          >
            {Object.entries(ADMISSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Visit Date
            </label>
            <input
              type="datetime-local"
              value={form.visitDate}
              onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              className="glass-input"
            />
            {errors.visitDate && (
              <p className="text-xs text-[var(--danger)]">{errors.visitDate}</p>
            )}
          </div>
        </div>

        <Textarea
          label="Chief Complaint"
          value={form.chiefComplaint}
          onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
          rows={2}
        />

        <Textarea
          label="Diagnosis"
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          rows={2}
        />

        <Textarea
          label="Treatment Plan"
          value={form.treatmentPlan}
          onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
          rows={2}
        />

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Vital Signs"
            value={form.vitalSigns}
            onChange={(e) => setForm({ ...form, vitalSigns: e.target.value })}
            rows={2}
          />
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

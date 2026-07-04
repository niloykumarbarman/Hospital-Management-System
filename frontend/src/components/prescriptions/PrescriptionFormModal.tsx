"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import {
  PrescriptionDto,
  CreatePrescriptionDto,
  CreatePrescriptionItemDto,
} from "@/types/prescription";
import { PatientDto } from "@/types/patient";
import { DoctorDto } from "@/types/doctor";
import { MedicineDto } from "@/types/medicine";
import { createPrescription, updatePrescription } from "@/lib/prescriptions";
import { getPatients } from "@/lib/patients";
import { getDoctors } from "@/lib/doctors";
import { getMedicines } from "@/lib/medicines";

interface PrescriptionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (prescription: PrescriptionDto) => void;
  prescription?: PrescriptionDto | null;
}

function toDateLocal(value: string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyItem(): CreatePrescriptionItemDto {
  return { medicineId: "", dosage: "", frequency: "", durationInDays: 1, instructions: "" };
}

function emptyForm(): CreatePrescriptionDto {
  return {
    patientId: "",
    doctorId: "",
    prescriptionDate: toDateLocal(new Date().toISOString()),
    notes: "",
    items: [emptyItem()],
  };
}

export default function PrescriptionFormModal({
  open,
  onClose,
  onSaved,
  prescription,
}: PrescriptionFormModalProps) {
  const [form, setForm] = useState<CreatePrescriptionDto>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const isEdit = !!prescription;

  useEffect(() => {
    if (!open) return;
    if (prescription) {
      setForm({
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        prescriptionDate: toDateLocal(prescription.prescriptionDate),
        notes: prescription.notes ?? "",
        items: prescription.items.length
          ? prescription.items.map((it) => ({
              medicineId: it.medicineId,
              dosage: it.dosage,
              frequency: it.frequency,
              durationInDays: it.durationInDays,
              instructions: it.instructions ?? "",
            }))
          : [emptyItem()],
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setItemErrors({});
    setApiError(null);
  }, [open, prescription]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError(null);
    Promise.all([getPatients(), getDoctors(), getMedicines()])
      .then(([p, d, m]) => {
        if (!cancelled) {
          setPatients(p);
          setDoctors(d);
          setMedicines(m);
        }
      })
      .catch(() => {
        if (!cancelled)
          setOptionsError("Failed to load form options. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function updateItem(index: number, patch: Partial<CreatePrescriptionItemDto>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.patientId) next.patientId = "Please select a patient.";
    if (!form.doctorId) next.doctorId = "Please select a doctor.";
    if (!form.prescriptionDate) next.prescriptionDate = "Prescription date is required.";
    if (form.items.length === 0) next.items = "At least one medicine item is required.";

    const nextItemErrors: Record<number, Record<string, string>> = {};
    form.items.forEach((it, i) => {
      const itErr: Record<string, string> = {};
      if (!it.medicineId) itErr.medicineId = "Select a medicine.";
      if (!it.dosage.trim()) itErr.dosage = "Dosage is required.";
      if (!it.frequency.trim()) itErr.frequency = "Frequency is required.";
      if (!it.durationInDays || it.durationInDays < 1)
        itErr.durationInDays = "Must be at least 1 day.";
      if (Object.keys(itErr).length) nextItemErrors[i] = itErr;
    });

    setErrors(next);
    setItemErrors(nextItemErrors);
    return Object.keys(next).length === 0 && Object.keys(nextItemErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        prescriptionDate: new Date(form.prescriptionDate).toISOString(),
        notes: form.notes || undefined,
        items: form.items.map((it) => ({
          ...it,
          instructions: it.instructions || undefined,
        })),
      };
      const saved = isEdit
        ? await updatePrescription(prescription!.id, payload)
        : await createPrescription(payload);
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
      title={isEdit ? "Edit Prescription" : "Add Prescription"}
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
            disabled={optionsLoading || isEdit}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Prescription Date
          </label>
          <input
            type="date"
            value={form.prescriptionDate}
            onChange={(e) => setForm({ ...form, prescriptionDate: e.target.value })}
            className="glass-input"
          />
          {errors.prescriptionDate && (
            <p className="text-xs text-[var(--danger)]">{errors.prescriptionDate}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Medicines
            </label>
            <Button type="button" variant="ghost" onClick={addItem}>
              <Plus size={15} className="mr-1" />
              Add Medicine
            </Button>
          </div>

          {errors.items && (
            <p className="text-xs text-[var(--danger)]">{errors.items}</p>
          )}

          {form.items.map((item, i) => (
            <div
              key={i}
              className="glass rounded-lg p-4 flex flex-col gap-3 border border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground-muted)]">
                  Medicine {i + 1}
                </span>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="focus-ring h-7 w-7 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <Select
                label="Medicine"
                value={item.medicineId}
                onChange={(e) => updateItem(i, { medicineId: e.target.value })}
                error={itemErrors[i]?.medicineId}
                disabled={optionsLoading}
              >
                <option value="">
                  {optionsLoading ? "Loading medicines..." : "Select a medicine"}
                </option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.genericName ? `(${m.genericName})` : ""}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Dosage"
                  placeholder="e.g. 500mg"
                  value={item.dosage}
                  onChange={(e) => updateItem(i, { dosage: e.target.value })}
                  error={itemErrors[i]?.dosage}
                />
                <Input
                  label="Frequency"
                  placeholder="e.g. Twice daily"
                  value={item.frequency}
                  onChange={(e) => updateItem(i, { frequency: e.target.value })}
                  error={itemErrors[i]?.frequency}
                />
              </div>

              <Input
                label="Duration (Days)"
                type="number"
                min={1}
                value={item.durationInDays}
                onChange={(e) =>
                  updateItem(i, { durationInDays: Number(e.target.value) })
                }
                error={itemErrors[i]?.durationInDays}
              />

              <Textarea
                label="Instructions"
                value={item.instructions}
                onChange={(e) => updateItem(i, { instructions: e.target.value })}
                rows={2}
              />
            </div>
          ))}
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
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Prescription"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

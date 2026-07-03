"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Gender, PatientDto, CreatePatientDto } from "@/types/patient";
import { createPatient, updatePatient } from "@/lib/patients";

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (patient: PatientDto) => void;
  patient?: PatientDto | null;
}

const emptyForm: CreatePatientDto = {
  fullName: "",
  gender: Gender.Male,
  dateOfBirth: "",
  phoneNumber: "",
  email: "",
  address: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export default function PatientFormModal({
  open,
  onClose,
  onSaved,
  patient,
}: PatientFormModalProps) {
  const [form, setForm] = useState<CreatePatientDto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEdit = !!patient;

  useEffect(() => {
    if (!open) return;
    if (patient) {
      setForm({
        fullName: patient.fullName,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth.slice(0, 10),
        phoneNumber: patient.phoneNumber ?? "",
        email: patient.email ?? "",
        address: patient.address ?? "",
        bloodGroup: patient.bloodGroup ?? "",
        emergencyContactName: patient.emergencyContactName ?? "",
        emergencyContactPhone: patient.emergencyContactPhone ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setApiError(null);
  }, [open, patient]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    else if (new Date(form.dateOfBirth) >= new Date())
      next.dateOfBirth = "Date of birth must be in the past.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Invalid email format.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreatePatientDto = {
        ...form,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        bloodGroup: form.bloodGroup || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
      };
      const saved = isEdit
        ? await updatePatient(patient!.id, payload)
        : await createPatient(payload);
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Patient" : "Add Patient"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: Number(e.target.value) as Gender })}
          >
            <option value={Gender.Male}>Male</option>
            <option value={Gender.Female}>Female</option>
            <option value={Gender.Other}>Other</option>
          </Select>

          <Input
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            error={errors.dateOfBirth}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
        </div>

        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Blood Group"
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            placeholder="e.g. O+"
          />
          <Input
            label="Emergency Contact Phone"
            value={form.emergencyContactPhone}
            onChange={(e) =>
              setForm({ ...form, emergencyContactPhone: e.target.value })
            }
          />
        </div>

        <Input
          label="Emergency Contact Name"
          value={form.emergencyContactName}
          onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
        />

        {apiError && (
          <p className="text-sm text-[var(--danger)]">{apiError}</p>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

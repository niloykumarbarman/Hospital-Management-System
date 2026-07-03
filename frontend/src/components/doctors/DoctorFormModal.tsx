"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { DoctorDto, CreateDoctorDto } from "@/types/doctor";
import { createDoctor, updateDoctor } from "@/lib/doctors";

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (doctor: DoctorDto) => void;
  doctor?: DoctorDto | null;
}

const emptyForm: CreateDoctorDto = {
  userId: "",
  specialization: "",
  qualification: "",
  licenseNumber: "",
  consultationFee: 0,
  experienceYears: 0,
};

export default function DoctorFormModal({
  open,
  onClose,
  onSaved,
  doctor,
}: DoctorFormModalProps) {
  const [form, setForm] = useState<CreateDoctorDto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEdit = !!doctor;

  useEffect(() => {
    if (!open) return;
    if (doctor) {
      setForm({
        userId: doctor.userId,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        licenseNumber: doctor.licenseNumber ?? "",
        consultationFee: doctor.consultationFee,
        experienceYears: doctor.experienceYears,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setApiError(null);
  }, [open, doctor]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!isEdit && !form.userId.trim()) next.userId = "User ID is required.";
    if (!form.specialization.trim())
      next.specialization = "Specialization is required.";
    if (!form.qualification.trim())
      next.qualification = "Qualification is required.";
    if (form.consultationFee < 0)
      next.consultationFee = "Consultation fee cannot be negative.";
    if (form.experienceYears < 0)
      next.experienceYears = "Experience years cannot be negative.";
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
        licenseNumber: form.licenseNumber || undefined,
      };
      const saved = isEdit
        ? await updateDoctor(doctor!.id, payload)
        : await createDoctor(payload);
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Doctor" : "Add Doctor"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <Input
            label="User ID"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            error={errors.userId}
            placeholder="Existing user's GUID"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Specialization"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            error={errors.specialization}
          />
          <Input
            label="Qualification"
            value={form.qualification}
            onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            error={errors.qualification}
          />
        </div>

        <Input
          label="License Number"
          value={form.licenseNumber}
          onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Consultation Fee"
            type="number"
            value={form.consultationFee}
            onChange={(e) =>
              setForm({ ...form, consultationFee: Number(e.target.value) })
            }
            error={errors.consultationFee}
          />
          <Input
            label="Experience (Years)"
            type="number"
            value={form.experienceYears}
            onChange={(e) =>
              setForm({ ...form, experienceYears: Number(e.target.value) })
            }
            error={errors.experienceYears}
          />
        </div>

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Doctor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

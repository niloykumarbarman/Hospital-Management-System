"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { DoctorDto, CreateDoctorDto } from "@/types/doctor";
import { UserDto } from "@/types/user";
import { createDoctor, updateDoctor } from "@/lib/doctors";
import { getUsers } from "@/lib/users";

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

  const [unassignedUsers, setUnassignedUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    setUsersLoading(true);
    setUsersError(null);
    getUsers("Doctor", true)
      .then((users) => {
        if (!cancelled) setUnassignedUsers(users);
      })
      .catch(() => {
        if (!cancelled)
          setUsersError("Failed to load users. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!isEdit && !form.userId.trim()) next.userId = "Please select a user.";
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
          <Select
            label="User"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            error={errors.userId || usersError || undefined}
            disabled={usersLoading}
          >
            <option value="">
              {usersLoading
                ? "Loading users..."
                : unassignedUsers.length === 0
                ? "No unassigned doctor users found"
                : "Select a user"}
            </option>
            {unassignedUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </Select>
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

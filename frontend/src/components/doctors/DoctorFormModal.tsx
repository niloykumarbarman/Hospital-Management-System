"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { DoctorDto, CreateDoctorDto } from "@/types/doctor";
import { UserDto } from "@/types/user";
import { createDoctor, updateDoctor } from "@/lib/doctors";
import { getUsers } from "@/lib/users";
import { registerUser } from "@/lib/auth";

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (doctor: DoctorDto) => void;
  doctor?: DoctorDto | null;
}

const DOCTOR_ROLE = 2; // HMS.Domain.Enums.UserRole.Doctor

const emptyForm: CreateDoctorDto = {
  userId: "",
  specialization: "",
  qualification: "",
  licenseNumber: "",
  consultationFee: 0,
  experienceYears: 0,
};

const emptyNewUser = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
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

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [newUserErrors, setNewUserErrors] = useState<Record<string, string>>({});
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

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
    setShowCreateUser(false);
    setNewUser(emptyNewUser);
    setNewUserErrors({});
    setCreateUserError(null);
  }, [open, doctor]);

  useEffect(() => {
    if (!open || isEdit) return;
    loadUnassignedUsers();
  }, [open, isEdit]);

  function loadUnassignedUsers() {
    setUsersLoading(true);
    setUsersError(null);
    return getUsers("Doctor", true)
      .then((users) => {
        setUnassignedUsers(users);
        return users;
      })
      .catch(() => {
        setUsersError("Failed to load users. Please try again.");
        return [];
      })
      .finally(() => {
        setUsersLoading(false);
      });
  }

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

  function validateNewUser(): boolean {
    const next: Record<string, string> = {};
    if (!newUser.fullName.trim()) next.fullName = "Full name is required.";
    if (!newUser.email.trim()) next.email = "Email is required.";
    if (!newUser.password || newUser.password.length < 6)
      next.password = "Password must be at least 6 characters.";
    setNewUserErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateUserError(null);
    if (!validateNewUser()) return;

    setCreatingUser(true);
    try {
      const result = await registerUser({
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        phoneNumber: newUser.phoneNumber.trim() || undefined,
        role: DOCTOR_ROLE,
      });

      // Re-fetch so the list stays consistent with the backend's
      // "unassigned doctor users" filter, then select the newly created one.
      const refreshed = await loadUnassignedUsers();
      const match = refreshed.find((u) => u.id === result.userId);
      setForm((prev) => ({ ...prev, userId: match ? result.userId : prev.userId }));

      setShowCreateUser(false);
      setNewUser(emptyNewUser);
      setNewUserErrors({});
    } catch (err: any) {
      const data = err?.response?.data;
      setCreateUserError(data?.message ?? "Failed to create user. Please try again.");
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Doctor" : "Add Doctor"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <div className="flex flex-col gap-2">
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

            {!usersLoading && unassignedUsers.length === 0 && !showCreateUser && (
              <div className="glass flex flex-col gap-2 px-4 py-3 text-sm">
                <p className="text-[var(--foreground-muted)]">
                  Every existing Doctor-role account already has a doctor profile.
                  Create a new user account to assign one.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="self-start"
                  onClick={() => setShowCreateUser(true)}
                >
                  <UserPlus size={16} className="mr-2" />
                  Create New User
                </Button>
              </div>
            )}

            {showCreateUser && (
              <div className="glass flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    New Doctor-role User
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUser(false);
                      setNewUser(emptyNewUser);
                      setNewUserErrors({});
                      setCreateUserError(null);
                    }}
                    className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    Cancel
                  </button>
                </div>

                <Input
                  label="Full Name"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  error={newUserErrors.fullName}
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  error={newUserErrors.email}
                />
                <Input
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  error={newUserErrors.password}
                />
                <Input
                  label="Phone Number (optional)"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                />

                {createUserError && (
                  <p className="text-sm text-[var(--danger)]">{createUserError}</p>
                )}

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="self-end"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </Button>
              </div>
            )}
          </div>
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

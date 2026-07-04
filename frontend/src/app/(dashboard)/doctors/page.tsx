"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Stethoscope, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DoctorFormModal from "@/components/doctors/DoctorFormModal";
import { DoctorDto } from "@/types/doctor";
import { getDoctors, deleteDoctor } from "@/lib/doctors";
import { useAuth } from "@/context/AuthContext";
import { canCreate, canEdit, canDelete } from "@/lib/permissions";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const allowCreate = canCreate(user?.role, "Doctor");
  const allowEdit = canEdit(user?.role, "Doctor");
  const allowDelete = canDelete(user?.role, "Doctor");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch {
      setError("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
    );
  }, [doctors, debouncedSearch]);

  function handleSaved(saved: DoctorDto) {
    setDoctors((prev) => {
      const exists = prev.some((d) => d.id === saved.id);
      return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoctor(deleteTarget.id);
      setDoctors((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete doctor. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Doctors</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage doctor profiles and schedules
          </p>
        </div>
        {allowCreate && (
          <Button
            onClick={() => {
              setEditingDoctor(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Doctor
          </Button>
        )}
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by name, specialization, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div className="glass flex items-center gap-2 px-4 py-3 text-sm text-[var(--danger)] animate-fade-in-up">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin-smooth" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard
          className="flex flex-col items-center justify-center text-center py-16 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="h-14 w-14 rounded-full btn-gradient flex items-center justify-center mb-4">
            <Stethoscope size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {doctors.length === 0 ? "No doctors yet" : "No matching doctors"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {doctors.length === 0
              ? "Add your first doctor to start building your records."
              : "Try a different search term."}
          </p>
          {doctors.length === 0 && allowCreate && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingDoctor(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Add Doctor
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doctor, i) => (
            <GlassCard
              key={doctor.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {doctor.fullName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {doctor.specialization}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {allowEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDoctor(doctor);
                        setModalOpen(true);
                      }}
                      className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doctor)}
                      className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                <span>{doctor.qualification}</span>
                {doctor.email && <span>{doctor.email}</span>}
                {doctor.phoneNumber && <span>{doctor.phoneNumber}</span>}
                <span>Fee: {doctor.consultationFee} · {doctor.experienceYears} yrs exp</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <DoctorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        doctor={editingDoctor}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
          style={{ animationDuration: "0.2s" }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="glass-card w-full max-w-sm p-6 animate-fade-in-up"
            style={{ animationDuration: "0.25s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Delete Doctor
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-medium">
                {deleteTarget.fullName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

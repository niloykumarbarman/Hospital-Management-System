"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import dynamic from "next/dynamic";
const PatientFormModal = dynamic(() => import("@/components/patients/PatientFormModal"), { ssr: false });
import { GENDER_LABELS, PatientDto } from "@/types/patient";
import { getPatients, deletePatient } from "@/lib/patients";
import { useAuth } from "@/context/AuthContext";
import { canCreate, canEdit, canDelete } from "@/lib/permissions";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const allowCreate = canCreate(user?.role, "Patient");
  const allowEdit = canEdit(user?.role, "Patient");
  const allowDelete = canDelete(user?.role, "Patient");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch {
      setError("Failed to load patients. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientCode.toLowerCase().includes(q) ||
        p.phoneNumber?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [patients, debouncedSearch]);

  function handleSaved(saved: PatientDto) {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.id);
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete patient. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Patients</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage patient records and profiles
          </p>
        </div>
        {allowCreate && (
          <Button
            onClick={() => {
              setEditingPatient(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Patient
          </Button>
        )}
      </div>

      <div
        className="relative animate-fade-in-up"
        style={{ animationDelay: "40ms" }}
      >
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by name, patient code, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div
          className="glass flex items-center gap-2 px-4 py-3 text-sm text-[var(--danger)] animate-fade-in-up"
        >
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
            <Users size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {patients.length === 0 ? "No patients yet" : "No matching patients"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {patients.length === 0
              ? "Add your first patient to start building your records."
              : "Try a different search term."}
          </p>
          {patients.length === 0 && allowCreate && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingPatient(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Add Patient
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient, i) => (
            <GlassCard
              key={patient.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {patient.fullName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {patient.patientCode}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {allowEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPatient(patient);
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
                      onClick={() => setDeleteTarget(patient)}
                      className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                <span>{GENDER_LABELS[patient.gender]} · {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                {patient.phoneNumber && <span>{patient.phoneNumber}</span>}
                {patient.email && <span>{patient.email}</span>}
                {patient.bloodGroup && <span>Blood Group: {patient.bloodGroup}</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <PatientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        patient={editingPatient}
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
              Delete Patient
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ClipboardList, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import dynamic from "next/dynamic";
const PrescriptionFormModal = dynamic(() => import("@/components/prescriptions/PrescriptionFormModal"), { ssr: false });
import { PrescriptionDto } from "@/types/prescription";
import { getPrescriptions, deletePrescription } from "@/lib/prescriptions";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<PrescriptionDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrescriptionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  async function loadPrescriptions() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPrescriptions();
      setPrescriptions(data);
    } catch {
      setError("Failed to load prescriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.items.some((it) => it.medicineName.toLowerCase().includes(q))
    );
  }, [prescriptions, debouncedSearch]);

  function handleSaved(saved: PrescriptionDto) {
    setPrescriptions((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePrescription(deleteTarget.id);
      setPrescriptions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete prescription. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Prescriptions</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage patient prescriptions and medicine orders
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPrescription(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Prescription
        </Button>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by patient, doctor, or medicine..."
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
            <ClipboardList size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {prescriptions.length === 0 ? "No prescriptions yet" : "No matching prescriptions"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {prescriptions.length === 0
              ? "Add your first prescription to get started."
              : "Try a different search term."}
          </p>
          {prescriptions.length === 0 && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingPrescription(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Add Prescription
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prescription, i) => (
            <GlassCard
              key={prescription.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {prescription.patientName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    Dr. {prescription.doctorName} · {prescription.specialization}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPrescription(prescription);
                      setModalOpen(true);
                    }}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(prescription)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <span className="text-xs text-[var(--foreground-muted)]">
                {formatDate(prescription.prescriptionDate)}
              </span>

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                {prescription.items.slice(0, 3).map((it) => (
                  <span key={it.id} className="line-clamp-1">
                    <span className="text-[var(--foreground)]">{it.medicineName}</span>{" "}
                    — {it.dosage}, {it.frequency}
                  </span>
                ))}
                {prescription.items.length > 3 && (
                  <span className="text-xs">
                    +{prescription.items.length - 3} more
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <PrescriptionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        prescription={editingPrescription}
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
              Delete Prescription
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete this prescription for{" "}
              <span className="text-[var(--foreground)] font-medium">
                {deleteTarget.patientName}
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

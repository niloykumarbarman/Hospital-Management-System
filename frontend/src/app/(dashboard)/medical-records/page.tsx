"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, FileText, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MedicalRecordFormModal from "@/components/medicalRecords/MedicalRecordFormModal";
import { MedicalRecordDto, AdmissionType, ADMISSION_TYPE_LABELS } from "@/types/medicalRecord";
import { getMedicalRecords, deleteMedicalRecord } from "@/lib/medicalRecords";

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecordDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalRecordDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicalRecords();
      setRecords(data);
    } catch {
      setError("Failed to load medical records. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.diagnosis?.toLowerCase().includes(q) ||
        r.chiefComplaint?.toLowerCase().includes(q)
    );
  }, [records, debouncedSearch]);

  function handleSaved(saved: MedicalRecordDto) {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedicalRecord(deleteTarget.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete medical record. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Medical Records</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Track patient visits, diagnoses, and treatment plans
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Record
        </Button>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by patient, doctor, or diagnosis..."
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
            <FileText size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {records.length === 0 ? "No medical records yet" : "No matching records"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {records.length === 0
              ? "Add your first medical record to start building patient history."
              : "Try a different search term."}
          </p>
          {records.length === 0 && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingRecord(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Add Record
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record, i) => (
            <GlassCard
              key={record.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {record.patientName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    Dr. {record.doctorName} · {record.specialization}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(record);
                      setModalOpen(true);
                    }}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(record)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                  {ADMISSION_TYPE_LABELS[record.admissionType as AdmissionType]}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {formatDate(record.visitDate)}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                {record.chiefComplaint && (
                  <span className="line-clamp-1">
                    <span className="text-[var(--foreground)]">Complaint:</span>{" "}
                    {record.chiefComplaint}
                  </span>
                )}
                {record.diagnosis && (
                  <span className="line-clamp-1">
                    <span className="text-[var(--foreground)]">Diagnosis:</span>{" "}
                    {record.diagnosis}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <MedicalRecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        record={editingRecord}
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
              Delete Medical Record
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete this record for{" "}
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

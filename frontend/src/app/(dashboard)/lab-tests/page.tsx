"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, FlaskConical, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LabTestFormModal from "@/components/labTests/LabTestFormModal";
import { LabTestDto } from "@/types/labTest";
import { getLabTests, deleteLabTest } from "@/lib/labTests";

export default function LabTestsPage() {
  const [labTests, setLabTests] = useState<LabTestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<LabTestDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabTestDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadLabTests();
  }, []);

  async function loadLabTests() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLabTests();
      setLabTests(data);
    } catch {
      setError("Failed to load lab tests. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return labTests;
    return labTests.filter(
      (l) =>
        l.patientName.toLowerCase().includes(q) ||
        l.testName.toLowerCase().includes(q) ||
        l.testType?.toLowerCase().includes(q)
    );
  }, [labTests, debouncedSearch]);

  function handleSaved(saved: LabTestDto) {
    setLabTests((prev) => {
      const exists = prev.some((l) => l.id === saved.id);
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLabTest(deleteTarget.id);
      setLabTests((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete lab test. Please try again.");
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Lab Test</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage lab test requests and results
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingLabTest(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Request Test
        </Button>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by patient, test name, or type..."
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
            <FlaskConical size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {labTests.length === 0 ? "No lab tests yet" : "No matching lab tests"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {labTests.length === 0
              ? "Request your first lab test to get started."
              : "Try a different search term."}
          </p>
          {labTests.length === 0 && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingLabTest(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Request Test
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((labTest, i) => (
            <GlassCard
              key={labTest.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {labTest.testName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {labTest.patientName}
                    {labTest.testType && ` · ${labTest.testType}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLabTest(labTest);
                      setModalOpen(true);
                    }}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(labTest)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {labTest.isCompleted ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] font-medium w-fit">
                  <CheckCircle2 size={12} />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium w-fit">
                  <Clock size={12} />
                  Pending
                </span>
              )}

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                <span>Requested: {formatDate(labTest.requestedDate)}</span>
                {labTest.isCompleted && labTest.resultValue && (
                  <span>
                    <span className="text-[var(--foreground)]">Result:</span>{" "}
                    {labTest.resultValue}
                    {labTest.normalRange && ` (Normal: ${labTest.normalRange})`}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <LabTestFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        labTest={editingLabTest}
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
              Delete Lab Test
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-medium">
                {deleteTarget.testName}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Pill, AlertCircle, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import dynamic from "next/dynamic";
const MedicineFormModal = dynamic(() => import("@/components/medicines/MedicineFormModal"), { ssr: false });
import { MedicineDto } from "@/types/medicine";
import { getMedicines, deleteMedicine } from "@/lib/medicines";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicineDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch {
      setError("Failed to load medicines. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.manufacturer?.toLowerCase().includes(q)
    );
  }, [medicines, debouncedSearch]);

  function handleSaved(saved: MedicineDto) {
    setMedicines((prev) => {
      const exists = prev.some((m) => m.id === saved.id);
      return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedicine(deleteTarget.id);
      setMedicines((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete medicine. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function formatExpiry(value: string | null): string | null {
    if (!value) return null;
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Medicine</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage medicine inventory and stock
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMedicine(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Medicine
        </Button>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by name, generic name, or manufacturer..."
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
            <Pill size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {medicines.length === 0 ? "No medicines yet" : "No matching medicines"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {medicines.length === 0
              ? "Add your first medicine to start building inventory."
              : "Try a different search term."}
          </p>
          {medicines.length === 0 && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingMedicine(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Add Medicine
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((medicine, i) => (
            <GlassCard
              key={medicine.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {medicine.name}
                  </p>
                  {medicine.genericName && (
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {medicine.genericName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMedicine(medicine);
                      setModalOpen(true);
                    }}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(medicine)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {medicine.isLowStock && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[var(--danger)]/15 text-[var(--danger)] font-medium w-fit">
                  <AlertTriangle size={12} />
                  Low Stock
                </span>
              )}

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                {medicine.manufacturer && <span>{medicine.manufacturer}</span>}
                <span>
                  Stock: {medicine.stockQuantity} {medicine.unit}(s) · Reorder at{" "}
                  {medicine.reorderLevel}
                </span>
                <span>Price: {medicine.unitPrice.toFixed(2)} / {medicine.unit}</span>
                {medicine.expiryDate && (
                  <span>Expires: {formatExpiry(medicine.expiryDate)}</span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <MedicineFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        medicine={editingMedicine}
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
              Delete Medicine
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-medium">
                {deleteTarget.name}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, CalendarClock, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import dynamic from "next/dynamic";
const AppointmentFormModal = dynamic(() => import("@/components/appointments/AppointmentFormModal"), { ssr: false });
import {
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  AppointmentDto,
} from "@/types/appointment";
import { getAppointments, deleteAppointment } from "@/lib/appointments";
import { useAuth } from "@/context/AuthContext";
import { canCreate, canEdit, canDelete } from "@/lib/permissions";

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]: "text-[var(--warning)] bg-[var(--warning)]/10",
  [AppointmentStatus.Confirmed]: "text-[var(--accent)] bg-[var(--accent)]/10",
  [AppointmentStatus.InProgress]: "text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10",
  [AppointmentStatus.Completed]: "text-[var(--success)] bg-[var(--success)]/10",
  [AppointmentStatus.Cancelled]: "text-[var(--danger)] bg-[var(--danger)]/10",
  [AppointmentStatus.NoShow]: "text-[var(--foreground-muted)] bg-white/5",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const allowCreate = canCreate(user?.role, "Appointment");
  const allowEdit = canEdit(user?.role, "Appointment");
  const allowDelete = canDelete(user?.role, "Appointment");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch {
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.specialization.toLowerCase().includes(q)
    );
  }, [appointments, debouncedSearch]);

  function handleSaved(saved: AppointmentDto) {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteTarget.id);
      setAppointments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete appointment. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Appointments</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Schedule and manage patient appointments
          </p>
        </div>
        {allowCreate && (
          <Button
            onClick={() => {
              setEditingAppointment(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Book Appointment
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
          placeholder="Search by patient, doctor, or specialization..."
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
            <CalendarClock size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {appointments.length === 0 ? "No appointments yet" : "No matching appointments"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {appointments.length === 0
              ? "Book your first appointment to get started."
              : "Try a different search term."}
          </p>
          {appointments.length === 0 && allowCreate && (
            <Button
              className="mt-5"
              onClick={() => {
                setEditingAppointment(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" />
              Book Appointment
            </Button>
          )}
        </GlassCard>
      ) : (
        <GlassCard
          className="overflow-x-auto animate-fade-in-up p-0"
          style={{ animationDelay: "80ms" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Patient</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Doctor</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Date</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Time</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Status</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Reason</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-[var(--foreground)] font-medium">
                    {a.patientName}
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">
                    {a.doctorName}
                    <span className="block text-xs">{a.specialization}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">
                    {new Date(a.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)]">
                    {a.appointmentTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE_CLASS[a.status]}`}
                    >
                      {APPOINTMENT_STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground-muted)] max-w-[200px] truncate">
                    {a.reasonForVisit ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {allowEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAppointment(a);
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
                          onClick={() => setDeleteTarget(a)}
                          className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      <AppointmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        appointment={editingAppointment}
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
              Delete Appointment
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete the appointment for{" "}
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

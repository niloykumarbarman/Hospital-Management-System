"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  CalendarClock,
  Receipt,
  UserPlus,
  CalendarPlus,
  FileText,
  FlaskConical,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { getPatients } from "@/lib/patients";
import { getDoctors } from "@/lib/doctors";
import { getAppointments } from "@/lib/appointments";
import { getInvoices } from "@/lib/invoices";
import { PaymentStatus } from "@/types/invoice";
import { AppointmentDto, APPOINTMENT_STATUS_LABELS, AppointmentStatus } from "@/types/appointment";

interface StatValues {
  patients: number;
  doctors: number;
  todaysAppointments: number;
  pendingInvoices: number;
}

const STAT_META = [
  { key: "patients", label: "Patients", icon: Users, color: "#14b8a6" },
  { key: "doctors", label: "Doctors", icon: Stethoscope, color: "#0ea5e9" },
  { key: "todaysAppointments", label: "Today's Appointments", icon: CalendarClock, color: "#a855f7" },
  { key: "pendingInvoices", label: "Pending Invoices", icon: Receipt, color: "#f59e0b" },
] as const;

const QUICK_ACTIONS = [
  { label: "Add Patient", href: "/patients", icon: UserPlus },
  { label: "Book Appointment", href: "/appointments", icon: CalendarPlus },
  { label: "New Prescription", href: "/prescriptions", icon: FileText },
  { label: "Request Lab Test", href: "/lab-tests", icon: FlaskConical },
] as const;

function statusBadgeColor(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Pending:
      return "text-amber-400 bg-amber-400/10";
    case AppointmentStatus.Confirmed:
      return "text-sky-400 bg-sky-400/10";
    case AppointmentStatus.InProgress:
      return "text-purple-400 bg-purple-400/10";
    case AppointmentStatus.Completed:
      return "text-emerald-400 bg-emerald-400/10";
    case AppointmentStatus.Cancelled:
    case AppointmentStatus.NoShow:
      return "text-red-400 bg-red-400/10";
    default:
      return "text-slate-400 bg-slate-400/10";
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatValues | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [patients, doctors, appointments, invoices] = await Promise.all([
          getPatients(),
          getDoctors(),
          getAppointments(),
          getInvoices(),
        ]);

        if (!isMounted) return;

        const today = new Date().toISOString().slice(0, 10);
        const todaysAppointments = appointments.filter(
          (a) => a.appointmentDate?.slice(0, 10) === today
        ).length;
        const pendingInvoices = invoices.filter(
          (i) =>
            i.paymentStatus === PaymentStatus.Unpaid ||
            i.paymentStatus === PaymentStatus.PartiallyPaid
        ).length;

        setStats({
          patients: patients.length,
          doctors: doctors.length,
          todaysAppointments,
          pendingInvoices,
        });

        const sorted = [...appointments].sort((a, b) => {
          const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
          return dateCompare !== 0 ? dateCompare : b.appointmentTime.localeCompare(a.appointmentTime);
        });
        setRecentAppointments(sorted.slice(0, 5));
      } catch (err) {
        if (isMounted) setError("Failed to load dashboard stats");
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Overview of hospital operations
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_META.map(({ key, label, icon: Icon, color }, index) => (
          <GlassCard
            key={key}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
                <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
                  {stats ? stats[key] : "—"}
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}99)`,
                  boxShadow: `0 4px 14px ${color}40`,
                }}
              >
                <Icon size={18} className="text-white" strokeWidth={2} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Recent Appointments
            </h2>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] py-6 text-center">
              No appointments yet.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {appt.patientName}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      Dr. {appt.doctorName} · {appt.appointmentDate} {appt.appointmentTime}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeColor(appt.status)}`}
                  >
                    {APPOINTMENT_STATUS_LABELS[appt.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="secondary" className="w-full justify-start gap-2">
                  <Icon size={16} />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

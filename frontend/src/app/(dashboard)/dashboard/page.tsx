"use client";

import { useEffect, useState } from "react";
import { Users, Stethoscope, CalendarClock, Receipt } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getPatients } from "@/lib/patients";
import { getDoctors } from "@/lib/doctors";
import { getAppointments } from "@/lib/appointments";
import { getInvoices } from "@/lib/invoices";
import { PaymentStatus } from "@/types/invoice";

interface StatValues {
  patients: number;
  doctors: number;
  todaysAppointments: number;
  pendingInvoices: number;
}

const STAT_META = [
  { key: "patients", label: "Patients", icon: Users },
  { key: "doctors", label: "Doctors", icon: Stethoscope },
  { key: "todaysAppointments", label: "Today's Appointments", icon: CalendarClock },
  { key: "pendingInvoices", label: "Pending Invoices", icon: Receipt },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<StatValues | null>(null);
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

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_META.map(({ key, label, icon: Icon }, index) => (
          <GlassCard
            key={key}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {label}
                </p>
                <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
                  {stats ? stats[key] : "—"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" strokeWidth={2} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

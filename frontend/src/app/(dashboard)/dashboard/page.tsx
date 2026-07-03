import { Users, Stethoscope, CalendarClock, Receipt } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const STATS = [
  { label: "Patients", icon: Users },
  { label: "Doctors", icon: Stethoscope },
  { label: "Today's Appointments", icon: CalendarClock },
  { label: "Pending Invoices", icon: Receipt },
] as const;

export default function DashboardPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon }, index) => (
          <GlassCard
            key={label}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {label}
                </p>
                <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
                  —
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

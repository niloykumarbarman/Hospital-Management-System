import { LucideIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          {description}
        </p>
      </div>

      <GlassCard className="flex flex-col items-center justify-center text-center py-16">
        <div className="h-14 w-14 rounded-full btn-gradient flex items-center justify-center mb-4 animate-soft-pulse">
          <Icon size={26} className="text-white" strokeWidth={2} />
        </div>
        <p className="text-lg font-semibold text-[var(--foreground)]">
          {title} module coming soon
        </p>
        <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
          This section is under active development and will be available shortly.
        </p>
      </GlassCard>
    </div>
  );
}

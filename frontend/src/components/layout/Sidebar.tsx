"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "./nav-items";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? "")
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
        <span className="text-lg font-bold animated-gradient-text tracking-tight">
          HMS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {items.map(({ label, href, icon: Icon }, index) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              style={{ animationDelay: `${index * 30}ms` }}
              className={clsx(
                "animate-fade-in-up focus-ring group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "btn-gradient text-white shadow-lg shadow-[var(--accent-glow)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 hover:translate-x-0.5"
              )}
            >
              {isActive && <span className="nav-item-active-bar" aria-hidden="true" />}
              <Icon
                size={18}
                strokeWidth={2}
                className={clsx(
                  "shrink-0 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

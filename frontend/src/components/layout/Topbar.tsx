"use client";

import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-[var(--border)] glass sticky top-0 z-10">
      <button
        type="button"
        onClick={onMenuClick}
        className="focus-ring md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-colors duration-200"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 md:flex-none" />

      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full btn-gradient flex items-center justify-center text-sm font-semibold text-white shrink-0 transition-transform duration-200 hover:scale-105">
            {getInitials(user?.fullName)}
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {user?.fullName ?? "Unknown"}
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              {user?.role ?? ""}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          aria-label="Logout"
          className="gap-2 hover:text-[var(--danger)]"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  DatabaseBackup,
  Download,
  Trash2,
  UploadCloud,
  AlertCircle,
  ShieldOff,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import type { BackupFileDto } from "@/types/backup";
import {
  getBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  restoreBackup,
} from "@/lib/backup";
import { useAuth } from "@/context/AuthContext";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BackupPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [backups, setBackups] = useState<BackupFileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackupFileDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) loadBackups();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadBackups() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBackups();
      setBackups(data);
    } catch {
      setError("Failed to load backups. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const saved = await createBackup();
      setBackups((prev) => [saved, ...prev]);
    } catch {
      setError("Failed to create backup. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDownload(fileName: string) {
    try {
      await downloadBackup(fileName);
    } catch {
      setError("Failed to download backup. Please try again.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBackup(deleteTarget.fileName);
      setBackups((prev) => prev.filter((b) => b.fileName !== deleteTarget.fileName));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete backup. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setRestoreTarget(file);
    e.target.value = "";
  }

  async function handleRestore() {
    if (!restoreTarget) return;
    setRestoring(true);
    setError(null);
    try {
      await restoreBackup(restoreTarget);
      setRestoreTarget(null);
      await loadBackups();
    } catch {
      setError(
        "Failed to restore backup. The file may be invalid or the database is unreachable."
      );
    } finally {
      setRestoring(false);
    }
  }

  if (!isAdmin) {
    return (
      <GlassCard className="flex flex-col items-center justify-center text-center py-16 animate-fade-in-up">
        <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <ShieldOff size={26} className="text-[var(--foreground-muted)]" strokeWidth={2} />
        </div>
        <p className="text-lg font-semibold text-[var(--foreground)]">Restricted</p>
        <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
          Only Admin users can access database backups.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Backup</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Create, download, and restore database backups
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".dump"
            className="hidden"
            onChange={handleFileChosen}
          />
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={16} className="mr-2" />
            Restore from file
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            <DatabaseBackup size={16} className="mr-2" />
            {creating ? "Creating..." : "Create Backup"}
          </Button>
        </div>
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
      ) : backups.length === 0 ? (
        <GlassCard
          className="flex flex-col items-center justify-center text-center py-16 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="h-14 w-14 rounded-full btn-gradient flex items-center justify-center mb-4">
            <DatabaseBackup size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">No backups yet</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            Create your first backup to protect the hospital&apos;s data.
          </p>
          <Button className="mt-5" onClick={handleCreate} disabled={creating}>
            <DatabaseBackup size={16} className="mr-2" />
            {creating ? "Creating..." : "Create Backup"}
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {backups.map((b) => (
              <div key={b.fileName} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">{b.fileName}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {formatDateTime(b.createdAtUtc)} • {formatBytes(b.sizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(b.fileName)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors duration-200"
                    title="Download"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(b)}
                    className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

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
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Delete Backup</h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-medium">{deleteTarget.fileName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
          style={{ animationDuration: "0.2s" }}
          onClick={() => !restoring && setRestoreTarget(null)}
        >
          <div
            className="glass-card w-full max-w-sm p-6 animate-fade-in-up"
            style={{ animationDuration: "0.25s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Restore Backup</h2>
            <p className="text-sm text-[var(--danger)] mb-2 font-medium">
              Warning: this will overwrite all current data.
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Restore from{" "}
              <span className="text-[var(--foreground)] font-medium">{restoreTarget.name}</span>?
              All active sessions will be disconnected during the restore.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setRestoreTarget(null)} disabled={restoring}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleRestore} disabled={restoring}>
                {restoring ? "Restoring..." : "Restore"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

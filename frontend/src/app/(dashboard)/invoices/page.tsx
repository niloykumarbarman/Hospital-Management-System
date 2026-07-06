"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Receipt, AlertCircle, Wallet } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import dynamic from "next/dynamic";
const InvoiceFormModal = dynamic(() => import("@/components/invoices/InvoiceFormModal"), { ssr: false });
const RecordPaymentModal = dynamic(() => import("@/components/invoices/RecordPaymentModal"), { ssr: false });
import { InvoiceDto, PaymentStatus, PAYMENT_STATUS_LABELS } from "@/types/invoice";
import { getInvoices, deleteInvoice } from "@/lib/invoices";
import { useAuth } from "@/context/AuthContext";
import { canCreate, canEdit, canDelete } from "@/lib/permissions";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: "bg-[var(--danger)]/15 text-[var(--danger)]",
  [PaymentStatus.PartiallyPaid]: "bg-[var(--accent)]/15 text-[var(--accent)]",
  [PaymentStatus.Paid]: "bg-[var(--success)]/15 text-[var(--success)]",
  [PaymentStatus.Refunded]: "bg-white/10 text-[var(--foreground-muted)]",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const allowCreate = canCreate(user?.role, "Invoice");
  const allowEdit = canEdit(user?.role, "Invoice");
  const allowDelete = canDelete(user?.role, "Invoice");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch {
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q)
    );
  }, [invoices, debouncedSearch]);

  function handleCreated(saved: InvoiceDto) {
    setInvoices((prev) => [saved, ...prev]);
  }

  function handlePaymentSaved(saved: InvoiceDto) {
    setInvoices((prev) => prev.map((inv) => (inv.id === saved.id ? saved : inv)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete invoice. Please try again.");
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Invoice</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Manage patient billing and payments
          </p>
        </div>
        {allowCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <Input
          placeholder="Search by patient or invoice number..."
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
            <Receipt size={26} className="text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm">
            {invoices.length === 0
              ? "Create your first invoice to start billing patients."
              : "Try a different search term."}
          </p>
          {invoices.length === 0 && allowCreate && (
            <Button className="mt-5" onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Invoice
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((invoice, i) => (
            <GlassCard
              key={invoice.id}
              className="flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {invoice.patientName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {allowEdit &&
                    invoice.paymentStatus !== PaymentStatus.Paid &&
                    invoice.paymentStatus !== PaymentStatus.Refunded && (
                      <button
                        type="button"
                        onClick={() => setPaymentTarget(invoice)}
                        className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-white/5 transition-colors duration-200"
                        title="Record Payment"
                      >
                        <Wallet size={15} />
                      </button>
                    )}
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(invoice)}
                      className="focus-ring h-8 w-8 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_STYLES[invoice.paymentStatus]}`}
              >
                {PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
              </span>

              <div className="flex flex-col gap-1 text-sm text-[var(--foreground-muted)]">
                <span>{formatDate(invoice.invoiceDate)}</span>
                <span>
                  Total: <span className="text-[var(--foreground)]">{invoice.totalAmount.toFixed(2)}</span>
                </span>
                <span>Paid: {invoice.paidAmount.toFixed(2)}</span>
                {invoice.dueAmount > 0 && (
                  <span className="text-[var(--danger)]">
                    Due: {invoice.dueAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <InvoiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleCreated}
      />

      <RecordPaymentModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSaved={handlePaymentSaved}
        invoice={paymentTarget}
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
              Delete Invoice
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-medium">
                {deleteTarget.invoiceNumber}
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

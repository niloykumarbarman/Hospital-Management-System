"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { InvoiceDto } from "@/types/invoice";
import { recordPayment } from "@/lib/invoices";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: InvoiceDto) => void;
  invoice: InvoiceDto | null;
}

export default function RecordPaymentModal({
  open,
  onClose,
  onSaved,
  invoice,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(invoice ? Number(invoice.dueAmount.toFixed(2)) : 0);
      setError(null);
      setApiError(null);
    }
  }, [open, invoice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!invoice) return;

    if (amount <= 0) {
      setError("Amount paid must be greater than zero.");
      return;
    }
    setError(null);

    setSubmitting(true);
    try {
      const saved = await recordPayment(invoice.id, { amountPaid: amount });
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (Array.isArray(data)) setApiError(data.join(" "));
      else setApiError(data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!invoice) return null;

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="glass rounded-lg p-4 flex flex-col gap-1 text-sm border border-[var(--border)]">
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Invoice</span>
            <span className="text-[var(--foreground)] font-medium">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Total Amount</span>
            <span className="text-[var(--foreground)]">{invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Already Paid</span>
            <span className="text-[var(--foreground)]">{invoice.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Due Amount</span>
            <span className="text-[var(--danger)] font-medium">
              {invoice.dueAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <Input
          label="Amount to Pay"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          error={error ?? undefined}
        />

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

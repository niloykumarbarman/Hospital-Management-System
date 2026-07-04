"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { InvoiceDto, CreateInvoiceDto, CreateInvoiceItemDto } from "@/types/invoice";
import { PatientDto } from "@/types/patient";
import { createInvoice } from "@/lib/invoices";
import { getPatients } from "@/lib/patients";

interface InvoiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: InvoiceDto) => void;
}

function toDateLocal(value: string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyItem(): CreateInvoiceItemDto {
  return { description: "", quantity: 1, unitPrice: 0 };
}

function emptyForm(): CreateInvoiceDto {
  return {
    patientId: "",
    invoiceDate: toDateLocal(new Date().toISOString()),
    items: [emptyItem()],
  };
}

export default function InvoiceFormModal({
  open,
  onClose,
  onSaved,
}: InvoiceFormModalProps) {
  const [form, setForm] = useState<CreateInvoiceDto>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setErrors({});
    setItemErrors({});
    setApiError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError(null);
    getPatients()
      .then((p) => {
        if (!cancelled) setPatients(p);
      })
      .catch(() => {
        if (!cancelled) setOptionsError("Failed to load patients. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function updateItem(index: number, patch: Partial<CreateInvoiceItemDto>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  const total = form.items.reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0),
    0
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.patientId) next.patientId = "Please select a patient.";
    if (!form.invoiceDate) next.invoiceDate = "Invoice date is required.";
    if (form.items.length === 0) next.items = "At least one item is required.";

    const nextItemErrors: Record<number, Record<string, string>> = {};
    form.items.forEach((it, i) => {
      const itErr: Record<string, string> = {};
      if (!it.description.trim()) itErr.description = "Description is required.";
      if (!it.quantity || it.quantity < 1) itErr.quantity = "Must be at least 1.";
      if (it.unitPrice < 0) itErr.unitPrice = "Cannot be negative.";
      if (Object.keys(itErr).length) nextItemErrors[i] = itErr;
    });

    setErrors(next);
    setItemErrors(nextItemErrors);
    return Object.keys(next).length === 0 && Object.keys(nextItemErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateInvoiceDto = {
        ...form,
        invoiceDate: new Date(form.invoiceDate).toISOString(),
      };
      const saved = await createInvoice(payload);
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

  return (
    <Modal open={open} onClose={onClose} title="Create Invoice">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            error={errors.patientId || optionsError || undefined}
            disabled={optionsLoading}
          >
            <option value="">
              {optionsLoading ? "Loading patients..." : "Select a patient"}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.patientCode})
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Invoice Date
            </label>
            <input
              type="date"
              value={form.invoiceDate}
              onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              className="glass-input"
            />
            {errors.invoiceDate && (
              <p className="text-xs text-[var(--danger)]">{errors.invoiceDate}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Items
            </label>
            <Button type="button" variant="ghost" onClick={addItem}>
              <Plus size={15} className="mr-1" />
              Add Item
            </Button>
          </div>

          {errors.items && (
            <p className="text-xs text-[var(--danger)]">{errors.items}</p>
          )}

          {form.items.map((item, i) => (
            <div
              key={i}
              className="glass rounded-lg p-4 flex flex-col gap-3 border border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground-muted)]">
                  Item {i + 1}
                </span>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="focus-ring h-7 w-7 flex items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <Input
                label="Description"
                placeholder="e.g. Consultation Fee"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                error={itemErrors[i]?.description}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  error={itemErrors[i]?.quantity}
                />
                <Input
                  label="Unit Price"
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                  error={itemErrors[i]?.unitPrice}
                />
              </div>

              <p className="text-xs text-[var(--foreground-muted)] text-right">
                Subtotal: {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
              </p>
            </div>
          ))}

          <div className="flex justify-end">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Total: {total.toFixed(2)}
            </p>
          </div>
        </div>

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

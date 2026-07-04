"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  MedicineDto,
  CreateMedicineDto,
  UpdateMedicineDto,
} from "@/types/medicine";
import { createMedicine, updateMedicine } from "@/lib/medicines";

interface MedicineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (medicine: MedicineDto) => void;
  medicine?: MedicineDto | null;
}

interface FormState {
  name: string;
  genericName: string;
  manufacturer: string;
  unit: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    genericName: "",
    manufacturer: "",
    unit: "",
    unitPrice: 0,
    stockQuantity: 0,
    reorderLevel: 10,
    expiryDate: "",
  };
}

export default function MedicineFormModal({
  open,
  onClose,
  onSaved,
  medicine,
}: MedicineFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEdit = !!medicine;

  useEffect(() => {
    if (!open) return;
    if (medicine) {
      setForm({
        name: medicine.name,
        genericName: medicine.genericName ?? "",
        manufacturer: medicine.manufacturer ?? "",
        unit: medicine.unit,
        unitPrice: medicine.unitPrice,
        stockQuantity: medicine.stockQuantity,
        reorderLevel: medicine.reorderLevel,
        expiryDate: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setApiError(null);
  }, [open, medicine]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Medicine name is required.";
    if (!form.unit.trim()) next.unit = "Unit is required.";
    if (form.unitPrice < 0) next.unitPrice = "Unit price cannot be negative.";
    if (!isEdit && form.stockQuantity < 0)
      next.stockQuantity = "Stock quantity cannot be negative.";
    if (form.reorderLevel < 0) next.reorderLevel = "Reorder level cannot be negative.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const base = {
        name: form.name,
        genericName: form.genericName || undefined,
        manufacturer: form.manufacturer || undefined,
        unit: form.unit,
        unitPrice: form.unitPrice,
        reorderLevel: form.reorderLevel,
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : undefined,
      };

      const saved = isEdit
        ? await updateMedicine(medicine!.id, base as UpdateMedicineDto)
        : await createMedicine({
            ...base,
            stockQuantity: form.stockQuantity,
          } as CreateMedicineDto);

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
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Medicine" : "Add Medicine"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Generic Name"
            value={form.genericName}
            onChange={(e) => setForm({ ...form, genericName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Manufacturer"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
          <Input
            label="Unit"
            placeholder="e.g. Tablet, Capsule"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            error={errors.unit}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unit Price"
            type="number"
            step="0.01"
            value={form.unitPrice}
            onChange={(e) =>
              setForm({ ...form, unitPrice: Number(e.target.value) })
            }
            error={errors.unitPrice}
          />
          <Input
            label="Reorder Level"
            type="number"
            value={form.reorderLevel}
            onChange={(e) =>
              setForm({ ...form, reorderLevel: Number(e.target.value) })
            }
            error={errors.reorderLevel}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!isEdit && (
            <Input
              label="Initial Stock Quantity"
              type="number"
              value={form.stockQuantity}
              onChange={(e) =>
                setForm({ ...form, stockQuantity: Number(e.target.value) })
              }
              error={errors.stockQuantity}
            />
          )}
          <Input
            label="Expiry Date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </div>

        {isEdit && (
          <p className="text-xs text-[var(--foreground-muted)]">
            Current stock: {medicine!.stockQuantity} {medicine!.unit}(s). Stock
            quantity can only be changed via a stock adjustment.
          </p>
        )}

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Medicine"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

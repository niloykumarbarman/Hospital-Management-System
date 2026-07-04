"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { LabTestDto, CreateLabTestDto, UpdateLabTestDto } from "@/types/labTest";
import { PatientDto } from "@/types/patient";
import { createLabTest, updateLabTest } from "@/lib/labTests";
import { getPatients } from "@/lib/patients";

interface LabTestFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (labTest: LabTestDto) => void;
  labTest?: LabTestDto | null;
}

function toDateLocal(value: string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface FormState {
  patientId: string;
  testName: string;
  testType: string;
  requestedDate: string;
  resultDate: string;
  resultValue: string;
  normalRange: string;
  remarks: string;
  isCompleted: boolean;
}

function emptyForm(): FormState {
  return {
    patientId: "",
    testName: "",
    testType: "",
    requestedDate: toDateLocal(new Date().toISOString()),
    resultDate: "",
    resultValue: "",
    normalRange: "",
    remarks: "",
    isCompleted: false,
  };
}

export default function LabTestFormModal({
  open,
  onClose,
  onSaved,
  labTest,
}: LabTestFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const isEdit = !!labTest;

  useEffect(() => {
    if (!open) return;
    if (labTest) {
      setForm({
        patientId: labTest.patientId,
        testName: labTest.testName,
        testType: labTest.testType ?? "",
        requestedDate: toDateLocal(labTest.requestedDate),
        resultDate: labTest.resultDate ? toDateLocal(labTest.resultDate) : "",
        resultValue: labTest.resultValue ?? "",
        normalRange: labTest.normalRange ?? "",
        remarks: labTest.remarks ?? "",
        isCompleted: labTest.isCompleted,
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setApiError(null);
  }, [open, labTest]);

  useEffect(() => {
    if (!open || isEdit) return;
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
  }, [open, isEdit]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!isEdit && !form.patientId) next.patientId = "Please select a patient.";
    if (!form.testName.trim()) next.testName = "Test name is required.";
    if (!form.requestedDate) next.requestedDate = "Requested date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      let saved: LabTestDto;
      if (isEdit) {
        const payload: UpdateLabTestDto = {
          testName: form.testName,
          testType: form.testType || undefined,
          requestedDate: new Date(form.requestedDate).toISOString(),
          resultDate: form.resultDate ? new Date(form.resultDate).toISOString() : undefined,
          resultValue: form.resultValue || undefined,
          normalRange: form.normalRange || undefined,
          remarks: form.remarks || undefined,
          isCompleted: form.isCompleted,
        };
        saved = await updateLabTest(labTest!.id, payload);
      } else {
        const payload: CreateLabTestDto = {
          patientId: form.patientId,
          testName: form.testName,
          testType: form.testType || undefined,
          requestedDate: new Date(form.requestedDate).toISOString(),
        };
        saved = await createLabTest(payload);
      }
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
      title={isEdit ? "Edit Lab Test" : "Request Lab Test"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
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
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Test Name"
            placeholder="e.g. Complete Blood Count"
            value={form.testName}
            onChange={(e) => setForm({ ...form, testName: e.target.value })}
            error={errors.testName}
          />
          <Input
            label="Test Type"
            placeholder="e.g. Blood, Urine, Imaging"
            value={form.testType}
            onChange={(e) => setForm({ ...form, testType: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">
            Requested Date
          </label>
          <input
            type="date"
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
            className="glass-input"
          />
          {errors.requestedDate && (
            <p className="text-xs text-[var(--danger)]">{errors.requestedDate}</p>
          )}
        </div>

        {isEdit && (
          <>
            <div className="h-px bg-[var(--border)] my-1" />
            <p className="text-sm font-medium text-[var(--foreground)]">Test Result</p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Result Value"
                value={form.resultValue}
                onChange={(e) => setForm({ ...form, resultValue: e.target.value })}
              />
              <Input
                label="Normal Range"
                value={form.normalRange}
                onChange={(e) => setForm({ ...form, normalRange: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Result Date
              </label>
              <input
                type="date"
                value={form.resultDate}
                onChange={(e) => setForm({ ...form, resultDate: e.target.value })}
                className="glass-input"
              />
            </div>

            <Textarea
              label="Remarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
            />

            <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.isCompleted}
                onChange={(e) => setForm({ ...form, isCompleted: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
              />
              Mark as completed
            </label>
          </>
        )}

        {apiError && <p className="text-sm text-[var(--danger)]">{apiError}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Request Test"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

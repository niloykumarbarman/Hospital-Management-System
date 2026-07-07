"use client";

import { useEffect, useState } from "react";
import { Users, CalendarClock, Receipt, FileHeart, AlertCircle, Download } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  downloadPatientListExcel,
  downloadAppointmentListExcel,
  downloadInvoicePdf,
  downloadPatientMedicalHistoryPdf,
} from "@/lib/reports";
import { getPatients } from "@/lib/patients";
import { getInvoices } from "@/lib/invoices";
import { PatientDto } from "@/types/patient";
import { InvoiceDto } from "@/types/invoice";

export default function ReportsPage() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [patientsRestricted, setPatientsRestricted] = useState(false);
  const [invoicesRestricted, setInvoicesRestricted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Patients and invoices are loaded independently: some roles (e.g.
    // Pharmacist, LabTechnician) aren't authorized to view invoices, and some
    // roles aren't authorized to view patients either. One restricted
    // resource shouldn't block the reports that don't need it.
    getPatients()
      .then((p) => {
        if (!cancelled) setPatients(p);
      })
      .catch(() => {
        if (!cancelled) setPatientsRestricted(true);
      })
      .finally(() => {
        if (!cancelled) setPatientsLoading(false);
      });

    getInvoices()
      .then((i) => {
        if (!cancelled) setInvoices(i);
      })
      .catch(() => {
        if (!cancelled) setInvoicesRestricted(true);
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownload(key: string, action: () => Promise<void>) {
    setError(null);
    setDownloading(key);
    try {
      await action();
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Report</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Generate and download hospital reports
        </p>
      </div>

      {error && (
        <div className="glass flex items-center gap-2 px-4 py-3 text-sm text-[var(--danger)] animate-fade-in-up">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Patient List</p>
              <p className="text-xs text-[var(--foreground-muted)]">Export all patients as Excel</p>
            </div>
          </div>
          <Button
            onClick={() => handleDownload("patients", downloadPatientListExcel)}
            disabled={downloading === "patients"}
          >
            <Download size={15} className="mr-2" />
            {downloading === "patients" ? "Generating..." : "Download Excel"}
          </Button>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center flex-shrink-0">
              <CalendarClock size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Appointment List</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Export appointments as Excel (optional date range)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)]">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input text-sm"
              />
            </div>
          </div>
          <Button
            onClick={() =>
              handleDownload("appointments", () =>
                downloadAppointmentListExcel(
                  startDate ? new Date(startDate).toISOString() : undefined,
                  endDate ? new Date(endDate).toISOString() : undefined
                )
              )
            }
            disabled={downloading === "appointments"}
          >
            <Download size={15} className="mr-2" />
            {downloading === "appointments" ? "Generating..." : "Download Excel"}
          </Button>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center flex-shrink-0">
              <Receipt size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Invoice Receipt</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Download a printable PDF receipt
              </p>
            </div>
          </div>
          {invoicesRestricted ? (
            <p className="text-xs text-[var(--foreground-muted)] py-2">
              You don&apos;t have permission to view invoices.
            </p>
          ) : (
            <>
              <Select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                disabled={invoicesLoading}
              >
                <option value="">
                  {invoicesLoading ? "Loading invoices..." : "Select an invoice"}
                </option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.patientName}
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => {
                  const invoice = invoices.find((i) => i.id === selectedInvoiceId);
                  if (!invoice) return;
                  handleDownload("invoice", () =>
                    downloadInvoicePdf(invoice.id, invoice.invoiceNumber)
                  );
                }}
                disabled={!selectedInvoiceId || downloading === "invoice"}
              >
                <Download size={15} className="mr-2" />
                {downloading === "invoice" ? "Generating..." : "Download PDF"}
              </Button>
            </>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center flex-shrink-0">
              <FileHeart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Patient Medical History</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Combined PDF of records, prescriptions, and lab tests
              </p>
            </div>
          </div>
          {patientsRestricted ? (
            <p className="text-xs text-[var(--foreground-muted)] py-2">
              You don&apos;t have permission to view patients.
            </p>
          ) : (
            <>
              <Select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={patientsLoading}
              >
                <option value="">
                  {patientsLoading ? "Loading patients..." : "Select a patient"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientCode})
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => {
                  const patient = patients.find((p) => p.id === selectedPatientId);
                  if (!patient) return;
                  handleDownload("medical-history", () =>
                    downloadPatientMedicalHistoryPdf(patient.id, patient.fullName)
                  );
                }}
                disabled={!selectedPatientId || downloading === "medical-history"}
              >
                <Download size={15} className="mr-2" />
                {downloading === "medical-history" ? "Generating..." : "Download PDF"}
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

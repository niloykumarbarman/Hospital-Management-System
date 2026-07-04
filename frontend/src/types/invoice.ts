export enum PaymentStatus {
  Unpaid = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Refunded = 4,
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: "Unpaid",
  [PaymentStatus.PartiallyPaid]: "Partially Paid",
  [PaymentStatus.Paid]: "Paid",
  [PaymentStatus.Refunded]: "Refunded",
};

export interface InvoiceItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface CreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  items: InvoiceItemDto[];
  createdAt: string;
}

export interface CreateInvoiceDto {
  patientId: string;
  invoiceDate: string;
  items: CreateInvoiceItemDto[];
}

export interface RecordPaymentDto {
  amountPaid: number;
}

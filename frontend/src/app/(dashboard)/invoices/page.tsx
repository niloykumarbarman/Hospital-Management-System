import { Receipt } from "lucide-react";
import ComingSoon from "@/components/layout/ComingSoon";

export default function InvoicesPage() {
  return (
    <ComingSoon
      title="Invoice"
      description="Manage billing and invoices"
      icon={Receipt}
    />
  );
}

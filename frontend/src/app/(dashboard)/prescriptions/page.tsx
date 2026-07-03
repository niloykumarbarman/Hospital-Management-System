import { ClipboardList } from "lucide-react";
import ComingSoon from "@/components/layout/ComingSoon";

export default function PrescriptionsPage() {
  return (
    <ComingSoon
      title="Prescription"
      description="Manage patient prescriptions"
      icon={ClipboardList}
    />
  );
}

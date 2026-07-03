import { FileText } from "lucide-react";
import ComingSoon from "@/components/layout/ComingSoon";

export default function MedicalRecordsPage() {
  return (
    <ComingSoon
      title="Medical Record"
      description="View and manage patient medical history"
      icon={FileText}
    />
  );
}

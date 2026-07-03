import { Pill } from "lucide-react";
import ComingSoon from "@/components/layout/ComingSoon";

export default function MedicinesPage() {
  return (
    <ComingSoon
      title="Medicine"
      description="Manage medicine inventory and stock"
      icon={Pill}
    />
  );
}

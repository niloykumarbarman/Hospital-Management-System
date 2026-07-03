import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarClock,
  FileText,
  ClipboardList,
  FlaskConical,
  Pill,
  Receipt,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patient", href: "/patients", icon: Users },
  { label: "Doctor", href: "/doctors", icon: Stethoscope },
  { label: "Appointment", href: "/appointments", icon: CalendarClock },
  { label: "Medical Record", href: "/medical-records", icon: FileText },
  { label: "Prescription", href: "/prescriptions", icon: ClipboardList },
  { label: "Lab Test", href: "/lab-tests", icon: FlaskConical },
  { label: "Medicine", href: "/medicines", icon: Pill },
  { label: "Invoice", href: "/invoices", icon: Receipt },
  { label: "Report", href: "/reports", icon: BarChart3 },
];

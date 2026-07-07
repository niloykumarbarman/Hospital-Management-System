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
  DatabaseBackup,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

// Menu visibility mirrors the backend's [Authorize(Roles = "...")] policies on
// each controller's GetAll/GetById endpoints. Keep this in sync if backend
// role policies change, otherwise a role could see a menu item that 403s.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Patient",
    href: "/patients",
    icon: Users,
    roles: ["Admin", "Doctor", "Receptionist", "Nurse"],
  },
  { label: "Doctor", href: "/doctors", icon: Stethoscope },
  {
    label: "Appointment",
    href: "/appointments",
    icon: CalendarClock,
    roles: ["Admin", "Doctor", "Receptionist", "Nurse"],
  },
  {
    label: "Medical Record",
    href: "/medical-records",
    icon: FileText,
    roles: ["Admin", "Doctor", "Nurse"],
  },
  {
    label: "Prescription",
    href: "/prescriptions",
    icon: ClipboardList,
    roles: ["Admin", "Doctor", "Nurse", "Pharmacist"],
  },
  {
    label: "Lab Test",
    href: "/lab-tests",
    icon: FlaskConical,
    roles: ["Admin", "Doctor", "LabTechnician", "Nurse"],
  },
  { label: "Medicine", href: "/medicines", icon: Pill },
  {
    label: "Invoice",
    href: "/invoices",
    icon: Receipt,
    roles: ["Admin", "Receptionist"],
  },
  { label: "Report", href: "/reports", icon: BarChart3 },
  { label: "Backup", href: "/backup", icon: DatabaseBackup, roles: ["Admin"] },
];

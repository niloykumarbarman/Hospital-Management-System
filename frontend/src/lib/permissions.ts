/**
 * Central role-based permission matrix, mirroring the [Authorize(Roles = "...")]
 * attributes on the backend controllers. Used to conditionally render
 * Create/Edit/Delete UI so users don't see actions the backend will reject.
 */

export type Role =
  | "Admin"
  | "Doctor"
  | "Receptionist"
  | "Nurse"
  | "Pharmacist"
  | "LabTechnician";

export type PermissionModule =
  | "Patient"
  | "Doctor"
  | "Appointment"
  | "MedicalRecord"
  | "Prescription"
  | "Medicine"
  | "LabTest"
  | "Invoice"
  | "StockAdjustment"
  | "Report"
  | "Backup"
  | "User";

type Action = "create" | "edit" | "delete";

const MATRIX: Record<PermissionModule, Partial<Record<Action, Role[]>>> = {
  Patient: {
    create: ["Admin", "Receptionist"],
    edit: ["Admin", "Receptionist"],
    delete: ["Admin"],
  },
  Doctor: {
    create: ["Admin"],
    edit: ["Admin"],
    delete: ["Admin"],
  },
  Appointment: {
    create: ["Admin", "Receptionist", "Doctor"],
    edit: ["Admin", "Receptionist", "Doctor"],
    delete: ["Admin", "Receptionist"],
  },
  MedicalRecord: {
    create: ["Admin", "Doctor"],
    edit: ["Admin", "Doctor"],
    delete: ["Admin"],
  },
  Prescription: {
    create: ["Admin", "Doctor"],
    edit: ["Admin", "Doctor"],
    delete: ["Admin"],
  },
  Medicine: {
    create: ["Admin", "Pharmacist"],
    edit: ["Admin", "Pharmacist"],
    delete: ["Admin"],
  },
  LabTest: {
    create: ["Admin", "Doctor", "LabTechnician"],
    edit: ["Admin", "LabTechnician"],
    delete: ["Admin"],
  },
  Invoice: {
    create: ["Admin", "Receptionist"],
    edit: ["Admin", "Receptionist"], // record-payment action
    delete: ["Admin"],
  },
  StockAdjustment: {
    create: ["Admin", "Pharmacist"],
  },
  Report: {},
  Backup: {},
  User: {},
};

/**
 * Returns true if the given role is allowed to perform the action on the module.
 * If the module/action has no entry in the matrix, defaults to false (safer default).
 */
export function can(
  role: string | null | undefined,
  module: PermissionModule,
  action: Action
): boolean {
  if (!role) return false;
  const allowed = MATRIX[module]?.[action];
  if (!allowed) return false;
  return allowed.includes(role as Role);
}

export function canCreate(role: string | null | undefined, module: PermissionModule) {
  return can(role, module, "create");
}

export function canEdit(role: string | null | undefined, module: PermissionModule) {
  return can(role, module, "edit");
}

export function canDelete(role: string | null | undefined, module: PermissionModule) {
  return can(role, module, "delete");
}

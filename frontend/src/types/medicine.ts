export interface MedicineDto {
  id: string;
  name: string;
  genericName: string | null;
  manufacturer: string | null;
  unit: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  expiryDate: string | null;
  createdAt: string;
}

export interface CreateMedicineDto {
  name: string;
  genericName?: string;
  manufacturer?: string;
  unit: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate?: string;
}

export interface UpdateMedicineDto {
  name: string;
  genericName?: string;
  manufacturer?: string;
  unit: string;
  unitPrice: number;
  reorderLevel: number;
  expiryDate?: string;
}

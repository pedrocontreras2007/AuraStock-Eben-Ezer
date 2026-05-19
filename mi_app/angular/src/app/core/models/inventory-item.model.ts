export type InventoryCategory = 'insumo' | 'relleno' | 'empaque' | 'utensilio' | 'otro';
export type InventoryUnit = string;

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  category: InventoryCategory;
  minStock: number;
  criticalStock: number;
  tenantId?: string;
  branchId?: string;
  recordedBy?: string;
  recordedByUser?: string | null;
}

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'tenantId' | 'branchId'>;

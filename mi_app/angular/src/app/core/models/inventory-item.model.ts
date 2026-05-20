export type InventoryCategory = 'insumo' | 'relleno' | 'empaque' | 'utensilio' | 'otro' | 'materia_prima' | 'salsas_gourmet' | 'bebestibles' | 'materiales_desechables' | 'frutas' | 'utiles_aseo';
export type InventoryUnit = string;

export interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  unit: InventoryUnit;
  category: InventoryCategory;
  minStock: number;
  criticalStock: number;
  tenantId?: string;
  branchId?: string;
  recordedBy?: string;
  recordedByUser?: string | null;
  inventoryDate?: string | null;
}

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'tenantId' | 'branchId'>;

export function parseQuantity(text: string | null | undefined): number {
  if (!text) return 0;
  const cleaned = text.trim().toLowerCase();
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)/);
  if (match) return parseFloat(match[1].replace(',', '.'));
  if (/^(media?|½)/.test(cleaned)) return 0.5;
  if (/^(un\b|una?\b)/.test(cleaned)) return 1;
  if (/^(cero\b|ningun)/.test(cleaned)) return 0;
  if (/^poquit/.test(cleaned) || /^poco/.test(cleaned)) return 0.25;
  return 0;
}

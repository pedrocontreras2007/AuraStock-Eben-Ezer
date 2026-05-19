export type ProductionCategory = 'lote_masa' | 'lote_relleno' | 'lote_preparado' | 'otro';

export interface Production {
  id: string;
  productName: string;
  category: ProductionCategory;
  quantity: number;
  date: Date;
  tenantId?: string;
  branchId?: string;
  recordedBy?: string;
  recordedByUser?: string | null;
  notes?: string;
}

export type ProductionInput = Omit<Production, 'id' | 'tenantId' | 'branchId'>;

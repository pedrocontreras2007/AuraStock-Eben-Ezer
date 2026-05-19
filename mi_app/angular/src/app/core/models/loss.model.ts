export type LossSource = 'inventory' | 'produccion';

export interface Loss {
  id: string;
  productName: string;
  quantity: number;
  reason: string;
  date: Date;
  recordedBy?: string;
  recordedByUser?: string | null;
  sourceType?: LossSource | null;
  sourceId?: string | null;
}

export interface LossInput {
  productName: string;
  quantity: number;
  reason: string;
  date?: Date;
  recordedBy?: string;
  recordedByUser?: string | null;
  sourceType?: LossSource | null;
  sourceId?: string | null;
}

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { InventoryItem, parseQuantity } from '../../core/models/inventory-item.model';

export interface WhatsAppSection {
  title: string;
  icon: string;
  items: { name: string; quantity: string; unit: string }[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  readonly categoryLabels: Record<string, string> = {
    materia_prima: 'Materia Prima', salsas_gourmet: 'Salsas gourmet', bebestibles: 'Bebestibles',
    materiales_desechables: 'Materiales desechables', frutas: 'Frutas', utiles_aseo: 'Útiles de aseo'
  };

  generateWhatsAppText(sections: WhatsAppSection[]): string {
    const now = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const lines: string[] = [
      `🧾 EBEN EZER — PEDIDO DE REPOSICIÓN`,
      `📅 ${now}`,
      ``
    ];
    for (const section of sections) {
      if (!section.items.length) continue;
      lines.push(`${section.icon} ${section.title}:`);
      for (const item of section.items) {
        lines.push(`• ${item.name} — ${item.quantity} ${item.unit}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  downloadExcel(items: InventoryItem[], filename: string): void {
    const data = items.map(item => {
      const q = parseQuantity(item.quantity);
      return {
        Producto: item.name,
        Categoría: this.categoryLabels[item.category] || item.category,
        Cantidad: item.quantity,
        Unidad: item.unit,
        'Stock Mín': item.minStock ?? 10,
        'Stock Crít': item.criticalStock ?? 5,
        Estado: q === 0 ? 'Agotado' : q <= (item.criticalStock ?? 5) ? 'Crítico' : q <= (item.minStock ?? 10) ? 'Bajo' : 'Normal',
        Faltante: Math.max(0, (item.minStock ?? 10) - q)
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

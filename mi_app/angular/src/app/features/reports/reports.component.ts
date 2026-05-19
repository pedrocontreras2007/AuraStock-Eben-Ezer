import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { InventoryItem } from '../../core/models/inventory-item.model';
import { Production } from '../../core/models/harvest.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';
import { ExportService } from '../../shared/services/export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, QuantityFormatPipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  readonly Math = Math;

  readonly categoryLabels: Record<string, string> = {
    insumo: 'Insumos', relleno: 'Rellenos', empaque: 'Empaques', utensilio: 'Utensilios', otro: 'Otros'
  };

  readonly vm$ = combineLatest([this.data.inventory$, this.data.production$]).pipe(
    map(([items, production]: [InventoryItem[], Production[]]) => {
      const inventoryStock = items.reduce((sum, item) => sum + item.quantity, 0);
      const productionStock = production.reduce((sum, p) => sum + p.quantity, 0);
      const totalStock = inventoryStock + productionStock;
      const healthyCount = items.filter(item => item.quantity > (item.criticalStock ?? 5)).length;
      const criticalItems = items.filter(item => item.quantity <= (item.criticalStock ?? 5)).sort((a, b) => a.quantity - b.quantity);
      const outOfStock = items.filter(item => item.quantity === 0);

      const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.quantity;
        return acc;
      }, {});

      const highestStock = items.length ? items.reduce((a, b) => (a.quantity >= b.quantity ? a : b)) : null;
      const lowestStock = items.length ? items.reduce((a, b) => (a.quantity <= b.quantity ? a : b)) : null;
      const averageStock = items.length ? totalStock / items.length : 0;

      const prodByCategory = production.reduce<Record<string, number>>((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + p.quantity;
        return acc;
      }, {});

      const recentProduction = [...production]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      const productionSummary = {
        total: production.length,
        totalQuantity: productionStock,
        averageQuantity: production.length ? productionStock / production.length : 0,
        byCategory: prodByCategory,
        recentProduction
      };

      return {
        items,
        totalStock,
        inventoryStock,
        productionStock,
        healthyCount,
        criticalItems,
        outOfStock,
        categoryTotals,
        highestStock,
        lowestStock,
        averageStock,
        productionSummary
      };
    })
  );

  constructor(
    private readonly data: DataService,
    private readonly exportSvc: ExportService
  ) {}

  downloadExcel(): void {
    this.exportSvc.downloadExcel(this.data.inventorySnapshot, 'Reporte_Eben_Ezer');
  }
}

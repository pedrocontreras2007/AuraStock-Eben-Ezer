import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { InventoryItem, parseQuantity } from '../../core/models/inventory-item.model';
import { Production } from '../../core/models/harvest.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';
import { ExportService } from '../../shared/services/export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuantityFormatPipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  readonly Math = Math;
  readonly dateFrom = this.fb.nonNullable.control<string>('');
  readonly dateTo = this.fb.nonNullable.control<string>('');

  readonly categoryLabels: Record<string, string> = {
    insumo: 'Insumos', relleno: 'Rellenos', empaque: 'Empaques', utensilio: 'Utensilios', otro: 'Otros',
    materia_prima: 'Materia Prima', salsas_gourmet: 'Salsas gourmet', bebestibles: 'Bebestibles',
    materiales_desechables: 'Materiales desechables', frutas: 'Frutas', utiles_aseo: 'Útiles de aseo'
  };

  readonly vm$ = combineLatest([
    this.data.inventory$,
    this.data.production$,
    this.dateFrom.valueChanges.pipe(startWith('')),
    this.dateTo.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([items, production, from, to]: [InventoryItem[], Production[], string, string]) => {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      const filteredProduction = production.filter(p => {
        if (fromDate && p.date < fromDate) return false;
        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (p.date > endOfDay) return false;
        }
        return true;
      });

      const inventoryStock = items.reduce((sum, item) => sum + parseQuantity(item.quantity), 0);
      const productionStock = filteredProduction.reduce((sum, p) => sum + p.quantity, 0);
      const totalStock = inventoryStock + productionStock;
      const healthyCount = items.filter(item => parseQuantity(item.quantity) > (item.criticalStock ?? 5)).length;
      const criticalItems = items.filter(item => { const q = parseQuantity(item.quantity); return q > 0 && q <= (item.criticalStock ?? 5); }).sort((a, b) => parseQuantity(a.quantity) - parseQuantity(b.quantity));
      const outOfStock = items.filter(item => parseQuantity(item.quantity) === 0);

      const categoryTotals = items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + parseQuantity(item.quantity);
        return acc;
      }, {});

      const highestStock = items.length ? items.reduce((a, b) => (parseQuantity(a.quantity) >= parseQuantity(b.quantity) ? a : b)) : null;
      const lowestStock = items.length ? items.reduce((a, b) => (parseQuantity(a.quantity) <= parseQuantity(b.quantity) ? a : b)) : null;
      const averageStock = items.length ? totalStock / items.length : 0;

      const prodByCategory = filteredProduction.reduce<Record<string, number>>((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + p.quantity;
        return acc;
      }, {});

      const recentProduction = [...filteredProduction]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      const productionSummary = {
        total: filteredProduction.length,
        totalQuantity: productionStock,
        averageQuantity: filteredProduction.length ? productionStock / filteredProduction.length : 0,
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
    private readonly fb: FormBuilder,
    private readonly data: DataService,
    private readonly exportSvc: ExportService
  ) {}

  downloadExcel(): void {
    this.exportSvc.downloadExcel(this.data.inventorySnapshot, 'Reporte_Eben_Ezer');
  }
}

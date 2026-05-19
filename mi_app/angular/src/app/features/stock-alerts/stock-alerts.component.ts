import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { InventoryItem } from '../../core/models/inventory-item.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';

interface StockAlertItem {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly category: string;
  readonly minStock: number;
  readonly criticalStock: number;
  readonly status: 'critical' | 'low' | 'out_of_stock' | 'ok';
  readonly icon: string;
}

interface StockAlertsViewModel {
  readonly ordered: StockAlertItem[];
  readonly criticalCount: number;
  readonly outOfStockCount: number;
  readonly lowStockCount: number;
}

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [CommonModule, QuantityFormatPipe],
  templateUrl: './stock-alerts.component.html',
  styleUrls: ['./stock-alerts.component.css']
})
export class StockAlertsComponent {
  readonly alerts$ = combineLatest([this.data.inventory$]).pipe(
    map(([inventory]): StockAlertsViewModel => {
      const alerts = inventory.map((item: InventoryItem): StockAlertItem => {
        const outOfStock = item.quantity === 0;
        const critical = item.quantity > 0 && item.quantity <= (item.criticalStock ?? 5);
        const low = item.quantity > (item.criticalStock ?? 5) && item.quantity <= (item.minStock ?? 10);

        let status: 'critical' | 'low' | 'out_of_stock' | 'ok';
        let icon: string;

        if (outOfStock) { status = 'out_of_stock'; icon = 'cancel'; }
        else if (critical) { status = 'critical'; icon = 'priority_high'; }
        else if (low) { status = 'low'; icon = 'warning'; }
        else { status = 'ok'; icon = 'check_circle'; }

        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'unidades',
          category: item.category,
          minStock: item.minStock ?? 10,
          criticalStock: item.criticalStock ?? 5,
          status,
          icon
        };
      });

      const ordered = alerts
        .filter(a => a.status !== 'ok')
        .sort((a, b) => {
          const order: Record<string, number> = { out_of_stock: 0, critical: 1, low: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });

      return {
        ordered,
        criticalCount: alerts.filter(a => a.status === 'critical' || a.status === 'out_of_stock').length,
        outOfStockCount: alerts.filter(a => a.status === 'out_of_stock').length,
        lowStockCount: alerts.filter(a => a.status === 'low').length
      };
    })
  );

  constructor(private readonly data: DataService) {}

  trackById(_: number, item: StockAlertItem): string {
    return item.id;
  }

  readonly statusLabels: Record<string, string> = {
    out_of_stock: 'Agotado',
    critical: 'Crítico',
    low: 'Stock bajo',
    ok: 'En stock'
  };
}

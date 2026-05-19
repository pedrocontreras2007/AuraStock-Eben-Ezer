import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Loss, LossSource } from '../../core/models/loss.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';
import { Production } from '../../core/models/harvest.model';
import { InventoryItem } from '../../core/models/inventory-item.model';
import { AuthService } from '../../core/services/auth.service';

interface LossRowView {
  readonly loss: Loss;
  readonly remainingStock: number | null;
  readonly sourceLabel: string;
}

interface LossProductOption {
  readonly ref: string;
  readonly name: string;
  readonly stock: number;
  readonly source: LossSource;
  readonly description: string;
}

interface LossProductSelection {
  readonly source: LossSource;
  readonly id: string;
  readonly name: string;
  readonly stock: number;
}

@Component({
  selector: 'app-losses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuantityFormatPipe],
  templateUrl: './losses.component.html',
  styleUrls: ['./losses.component.css']
})
export class LossesComponent {
  private static readonly CHART_PALETTE = ['#d32f2f', '#c62828', '#b71c1c', '#e53935', '#ef5350', '#e57373', '#ef9a9a'];
  readonly chartRadius = 64;
  readonly chartCircumference = 2 * Math.PI * this.chartRadius;
  readonly chartSize = this.chartRadius * 2 + 24;
  readonly chartCenter = this.chartSize / 2;
  readonly chartViewBox = `0 0 ${this.chartSize} ${this.chartSize}`;

  readonly filterControl = this.fb.nonNullable.control<string>('todos');

  readonly vm$ = combineLatest([
    this.data.losses$,
    this.data.inventory$,
    this.data.production$,
    this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
  ]).pipe(
    map(([losses, inventory, production, filter]) => {
      const availableProducts = this.buildAvailableProducts(production, inventory);
      const filtered = filter === 'todos' ? losses : losses.filter(loss => {
        if (filter === 'inventory') return loss.sourceType === 'inventory';
        if (filter === 'produccion') return loss.sourceType === 'produccion';
        return true;
      });
      const ordered = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime());
      const totalQuantity = ordered.reduce((sum, loss) => sum + loss.quantity, 0);
      const inventoryMap = new Map(inventory.map(item => [item.id, item]));
      const productionMap = new Map(production.map(entry => [entry.id, entry]));
      const lossRows = this.buildLossRows(ordered, inventoryMap, productionMap);
      return { losses: ordered, lossRows, totalQuantity, availableProducts, selectedFilter: filter };
    })
  );

  showForm = false;
  submitting = false;

  readonly form = this.fb.group({
    productRef: this.fb.nonNullable.control('', [Validators.required]),
    quantity: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[0-9]*$/)]),
    reason: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(500)]),
    date: this.fb.nonNullable.control(this.toISODate(new Date()), [Validators.required])
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly data: DataService,
    private readonly auth: AuthService
  ) {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.form.reset({ productRef: '', quantity: '', reason: '', date: this.toISODate(new Date()) });
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const reason = raw.reason.trim();
    const productRef = raw.productRef;
    if (!productRef) { this.form.controls.productRef.setErrors({ required: true }); return; }

    const quantity = Math.round(Number(raw.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) { this.form.controls.quantity.setErrors({ invalid: true }); return; }

    const selection = this.resolveProductSelection(productRef);
    if (!selection) { this.form.controls.productRef.setErrors({ invalid: true }); return; }
    if (quantity > selection.stock) { this.form.controls.quantity.setErrors({ exceedStock: true }); return; }
    if (!reason) { this.form.controls.reason.setErrors({ required: true }); return; }

    this.submitting = true;
    this.data.addLoss({
      productName: selection.name,
      quantity,
      reason,
      date: new Date(raw.date),
      sourceType: selection.source,
      sourceId: selection.id
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showForm = false;
        this.form.reset({ productRef: '', quantity: '', reason: '', date: this.toISODate(new Date()) });
      },
      error: () => { this.submitting = false; }
    });
  }

  cancel(): void {
    this.showForm = false;
    this.form.reset({ productRef: '', quantity: '', reason: '', date: this.toISODate(new Date()) });
  }

  remove(loss: Loss): void {
    if (window.confirm(`¿Eliminar la merma registrada de ${loss.productName}?`)) {
      this.data.removeLoss(loss.id);
    }
  }

  trackLoss(_: number, row: LossRowView): string { return row.loss.id; }

  private buildLossRows(losses: Loss[], inventoryMap: Map<string, InventoryItem>, productionMap: Map<string, Production>): LossRowView[] {
    return losses.map(loss => {
      let remainingStock: number | null = null;
      let sourceLabel = 'Origen no disponible';

      if (loss.sourceType === 'inventory' && loss.sourceId) {
        const item = inventoryMap.get(loss.sourceId);
        sourceLabel = item ? `Inventario · ${item.category}` : 'Inventario';
        remainingStock = item?.quantity ?? null;
      } else if (loss.sourceType === 'produccion' && loss.sourceId) {
        const prod = productionMap.get(loss.sourceId);
        sourceLabel = prod ? `Producción · ${prod.category}` : 'Producción';
        remainingStock = prod?.quantity ?? null;
      }
      return { loss, remainingStock, sourceLabel };
    });
  }

  private buildAvailableProducts(production: Production[], inventory: InventoryItem[]): LossProductOption[] {
    const inventoryOptions: LossProductOption[] = inventory
      .filter(item => item.quantity > 0)
      .map(item => ({ ref: `inventory:${item.id}`, name: item.name, stock: item.quantity, source: 'inventory', description: `Inventario · ${item.category}` }));
    const productionOptions: LossProductOption[] = production
      .filter(p => p.quantity > 0)
      .map(p => ({ ref: `produccion:${p.id}`, name: p.productName, stock: p.quantity, source: 'produccion', description: `Producción · ${p.category}` }));
    return [...inventoryOptions, ...productionOptions].sort((a, b) => a.name.localeCompare(b.name, 'es-CL', { sensitivity: 'base' }));
  }

  private resolveProductSelection(ref: string): LossProductSelection | null {
    if (!ref) return null;
    const [source, id] = ref.split(':');
    if (!source || !id) return null;
    if (source === 'inventory') {
      const item = this.data.inventorySnapshot.find(e => e.id === id);
      return item ? { source: 'inventory', id, name: item.name, stock: item.quantity } : null;
    }
    if (source === 'produccion') {
      const prod = this.data.productionSnapshot.find(e => e.id === id);
      return prod ? { source: 'produccion', id, name: prod.productName, stock: prod.quantity } : null;
    }
    return null;
  }

  getProductOption(products: LossProductOption[], ref: string | null): LossProductOption | undefined {
    return ref ? products.find(p => p.ref === ref) : undefined;
  }

  private toISODate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
  }
}

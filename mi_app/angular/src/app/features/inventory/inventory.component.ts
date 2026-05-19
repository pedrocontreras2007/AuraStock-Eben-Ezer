import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { InventoryCategory, InventoryItem } from '../../core/models/inventory-item.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuantityFormatPipe],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent {
  readonly filterControl = this.fb.nonNullable.control<string>('todos');

  readonly vm$ = combineLatest([
    this.data.inventory$,
    this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
  ]).pipe(
    map(([items, filter]) => {
      const filtered = filter === 'todos' ? items : items.filter(item => item.category === filter);
      const groups = this.categories
        .map(cat => ({
          category: cat.value,
          label: cat.label,
          items: filtered.filter(item => item.category === cat.value)
        }))
        .filter(g => g.items.length > 0);
      return { groups, selectedFilter: filter, totalItems: filtered.length };
    })
  );

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    quantity: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[0-9]*$/)]),
    category: this.fb.nonNullable.control<InventoryCategory>('insumo'),
    unit: this.fb.control('unidades'),
    minStock: this.fb.control('10', [Validators.pattern(/^[0-9]*$/)]),
    criticalStock: this.fb.control('5', [Validators.pattern(/^[0-9]*$/)])
  });

  readonly categories: { value: InventoryCategory; label: string }[] = [
    { value: 'insumo', label: 'Insumo' },
    { value: 'relleno', label: 'Relleno' },
    { value: 'empaque', label: 'Empaque' },
    { value: 'utensilio', label: 'Utensilio' },
    { value: 'otro', label: 'Otro' }
  ];

  readonly categoryLabels: Record<string, string> = {
    insumo: 'Insumo', relleno: 'Relleno', empaque: 'Empaque', utensilio: 'Utensilio', otro: 'Otro'
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly data: DataService,
    private readonly auth: AuthService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const parsed = Number(raw.quantity);
    if (!Number.isFinite(parsed) || parsed < 0) {
      this.form.controls.quantity.setErrors({ invalid: true });
      return;
    }

    const quantity = Math.round(parsed);
    const recordedByUser = this.auth.user?.email ?? undefined;

    this.data.addInventoryItem({
      name: raw.name.trim(),
      quantity,
      unit: raw.unit || 'unidades',
      category: raw.category,
      minStock: Number(raw.minStock) || 10,
      criticalStock: Number(raw.criticalStock) || 5,
      recordedByUser
    });

    this.form.reset({
      name: '',
      quantity: '',
      category: 'insumo',
      unit: 'unidades',
      minStock: '10',
      criticalStock: '5'
    });
  }

  adjustQuantity(item: InventoryItem): void {
    const initialValue = Math.round(item.quantity).toString();
    const input = window.prompt(`Nueva cantidad para ${item.name}`, initialValue);
    if (input === null) return;

    const value = Number(input.trim());
    if (!Number.isFinite(value) || value < 0) {
      window.alert('Ingresa un número válido.');
      return;
    }

    const sanitized = Math.round(value);
    const recordedByUser = this.auth.user?.email ?? undefined;
    this.data.updateInventoryQuantity(item.id, sanitized, undefined, recordedByUser);
  }

  trackById(_: number, item: InventoryItem): string {
    return item.id;
  }

  isLowStock(item: InventoryItem): boolean {
    return item.quantity <= (item.criticalStock ?? 5);
  }

  isOutOfStock(item: InventoryItem): boolean {
    return item.quantity === 0;
  }
}

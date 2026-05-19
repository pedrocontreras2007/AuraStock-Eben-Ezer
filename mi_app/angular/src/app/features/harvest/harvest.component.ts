import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Production, ProductionCategory } from '../../core/models/harvest.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-harvest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuantityFormatPipe, ModalComponent],
  templateUrl: './harvest.component.html',
  styleUrls: ['./harvest.component.css']
})
export class HarvestComponent {
  readonly filterControl = this.fb.nonNullable.control<string>('todos');
  readonly vm$ = combineLatest([
    this.data.production$,
    this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
  ]).pipe(
    map(([items, filter]) => {
      const filtered = filter === 'todos' ? items : items.filter(item => {
        if (filter === 'lote_masa') return item.category === 'lote_masa';
        if (filter === 'lote_relleno') return item.category === 'lote_relleno';
        if (filter === 'lote_preparado') return item.category === 'lote_preparado';
        return true;
      });
      const fifoQueue = [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime());
      return { items: filtered, total: filtered.length, selectedFilter: filter, fifoQueue };
    })
  );

  readonly form = this.fb.group({
    productName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    quantity: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^[0-9]*[.,]?[0-9]{0,2}$/)]),
    category: this.fb.nonNullable.control<ProductionCategory>('lote_masa'),
    notes: this.fb.control('', [Validators.maxLength(500)])
  });

  submitting = false;

  readonly categories: { value: ProductionCategory; label: string }[] = [
    { value: 'lote_masa', label: 'Lote de masa' },
    { value: 'lote_relleno', label: 'Lote de relleno' },
    { value: 'lote_preparado', label: 'Lote preparado' },
    { value: 'otro', label: 'Otro' }
  ];

  @ViewChild('deleteModal') deleteModal!: ModalComponent;

  private deletingItem?: Production;

  constructor(
    private readonly fb: FormBuilder,
    private readonly data: DataService,
    private readonly auth: AuthService
  ) {}

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const parsed = parseFloat(raw.quantity.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.form.controls.quantity.setErrors({ invalid: true });
      return;
    }

    const quantity = Math.round(parsed);
    this.submitting = true;
    const recordedByUser = this.auth.user?.email ?? undefined;

    this.data.addProduction({
      productName: raw.productName.trim(),
      category: raw.category,
      quantity,
      date: new Date(),
      recordedByUser,
      notes: raw.notes?.trim() || undefined
    });

    this.form.reset({
      productName: '',
      quantity: '',
      category: 'lote_masa',
      notes: ''
    });
    this.submitting = false;
  }

  deleteItem(id: string): void {
    const items = this.data.productionSnapshot;
    const item = items.find(p => p.id === id);
    if (!item) return;
    this.deletingItem = item;
    this.deleteModal.open({
      mode: 'confirm',
      title: 'Eliminar producción',
      message: `¿Eliminar el registro de producción de "${item.productName}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
  }

  onDeleteConfirm(): void {
    if (!this.deletingItem) return;
    this.data.deleteProduction(this.deletingItem.id);
    this.deleteModal.close();
  }

  onDeleteCancel(): void {
    this.deletingItem = undefined;
  }

  trackItem(_: number, item: Production): string {
    return item.id;
  }
}

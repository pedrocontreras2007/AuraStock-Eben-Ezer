import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { InventoryCategory, InventoryItem, parseQuantity } from '../../core/models/inventory-item.model';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { ToastComponent } from '../../shared/components/toast.component';
import { ExportService } from '../../shared/services/export.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ToastComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent {
  readonly filterControl = this.fb.nonNullable.control<string>('todos');
  readonly searchControl = this.fb.nonNullable.control<string>('');

  readonly vm$ = combineLatest([
    this.data.inventory$,
    this.filterControl.valueChanges.pipe(startWith(this.filterControl.value)),
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value))
  ]).pipe(
    map(([items, filter, query]) => {
      const q = query.toLowerCase().trim();
      const catFiltered = filter === 'todos' ? items : items.filter(item => item.category === filter);
      const searched = !q ? catFiltered : catFiltered.filter(item => item.name.toLowerCase().includes(q));
      const groups = this.categories
        .map(cat => ({
          category: cat.value,
          label: cat.label,
          items: searched.filter(item => item.category === cat.value)
        }))
        .filter(g => g.items.length > 0);
      return { groups, selectedFilter: filter, totalItems: searched.length, query: q };
    })
  );

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    quantity: this.fb.nonNullable.control('', [Validators.required]),
    category: this.fb.nonNullable.control<InventoryCategory>('insumo'),
    unit: this.fb.control('unidades'),
    minStock: this.fb.control('10'),
    criticalStock: this.fb.control('5')
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

  @ViewChild('adjustModal') adjustModal!: ModalComponent;
  @ViewChild('deleteModal') deleteModal!: ModalComponent;
  @ViewChild('toast') toast!: ToastComponent;

  private adjustingItem?: InventoryItem;
  private deletingItem?: InventoryItem;

  constructor(
    private readonly fb: FormBuilder,
    private readonly data: DataService,
    private readonly auth: AuthService,
    private readonly exportSvc: ExportService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const recordedByUser = this.auth.user?.email ?? undefined;

    this.data.addInventoryItem({
      name: raw.name.trim(),
      quantity: raw.quantity.trim(),
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
    this.adjustingItem = item;
    this.adjustModal.open({
      mode: 'input',
      title: 'Ajustar cantidad',
      message: `Nueva cantidad para ${item.name}`,
      inputValue: item.quantity,
      confirmText: 'Guardar',
      cancelText: 'Cancelar'
    });
  }

  onAdjustConfirm(value: string): void {
    const item = this.adjustingItem;
    if (!item) return;

    const recordedByUser = this.auth.user?.email ?? undefined;
    this.data.updateInventoryQuantity(item.id, value.trim(), undefined, recordedByUser);
    this.adjustModal.close();
  }

  onAdjustCancel(): void {
    this.adjustingItem = undefined;
  }

  deleteItem(item: InventoryItem): void {
    this.deletingItem = item;
    this.deleteModal.open({
      mode: 'confirm',
      title: 'Eliminar producto',
      message: `¿Eliminar "${item.name}" del inventario? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
  }

  onDeleteConfirm(): void {
    if (!this.deletingItem) return;
    this.data.deleteInventoryItem(this.deletingItem.id);
    this.deleteModal.close();
  }

  onDeleteCancel(): void {
    this.deletingItem = undefined;
  }

  sendWhatsApp(): void {
    const items = this.data.inventorySnapshot;
    const supplies = items.filter(i => i.category === 'insumo' || i.category === 'relleno');
    const text = this.exportSvc.generateWhatsAppText([
      { title: 'AGOTADOS', icon: '❌', items: supplies.filter(i => parseQuantity(i.quantity) === 0) },
      { title: 'STOCK CRÍTICO', icon: '⚠️', items: supplies.filter(i => { const q = parseQuantity(i.quantity); return q > 0 && q <= (i.criticalStock ?? 5); }) },
      { title: 'STOCK BAJO', icon: '🔄', items: supplies.filter(i => { const q = parseQuantity(i.quantity); return q <= (i.minStock ?? 10) && q > (i.criticalStock ?? 5); }) }
    ]);
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show({ message: 'Texto copiado — pégalo en WhatsApp', type: 'success' });
    });
  }

  downloadExcel(): void {
    this.exportSvc.downloadExcel(this.data.inventorySnapshot, 'Inventario_Eben_Ezer');
    this.toast.show({ message: 'Archivo Excel descargado', type: 'success' });
  }

  trackById(_: number, item: InventoryItem): string {
    return item.id;
  }

  isLowStock(item: InventoryItem): boolean {
    const q = parseQuantity(item.quantity);
    return q > 0 && q <= (item.criticalStock ?? 5);
  }

  isOutOfStock(item: InventoryItem): boolean {
    return parseQuantity(item.quantity) === 0;
  }
}

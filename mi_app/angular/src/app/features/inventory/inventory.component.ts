import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { CdkDragDrop, CdkDropList, CdkDropListGroup, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataService } from '../../core/services/data.service';
import { InventoryCategory, InventoryItem, parseQuantity } from '../../core/models/inventory-item.model';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { ToastComponent } from '../../shared/components/toast.component';
import { ExportService } from '../../shared/services/export.service';

const DEFAULT_MIN_STOCK = '10';
const DEFAULT_CRITICAL_STOCK = '5';
const DEFAULT_CATEGORY: InventoryCategory = 'materia_prima';
const DEFAULT_UNIT = 'unidades';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ToastComponent, CdkDropList, CdkDropListGroup, CdkDrag],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent {
  readonly filterControl = this.fb.nonNullable.control<string>('todos');
  readonly searchControl = this.fb.nonNullable.control<string>('');

  reorderEnabled = false;
  countEnabled = false;
  private reorderGroups: { category: string; label: string; items: InventoryItem[] }[] | null = null;

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

      if (this.reorderEnabled && !this.reorderGroups) {
        this.reorderGroups = groups.map(g => ({ ...g, items: [...g.items] }));
      }

      const filteredCounted = searched.filter(i => i.countedAt != null).length;

      return {
        groups: this.reorderEnabled && this.reorderGroups ? this.reorderGroups : groups,
        selectedFilter: filter,
        totalItems: searched.length,
        query: q,
        filteredCounted,
        totalItemsAll: items.length,
        totalCounted: items.filter(i => i.countedAt != null).length,
        countProgress: searched.length > 0 ? Math.round((filteredCounted / searched.length) * 100) : 0
      };
    })
  );

  private get todayChileDate(): string {
    const formatter = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  }

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    quantity: this.fb.nonNullable.control('', [Validators.required]),
    category: this.fb.nonNullable.control<InventoryCategory>(DEFAULT_CATEGORY),
    unit: this.fb.control(DEFAULT_UNIT),
    minStock: this.fb.control(DEFAULT_MIN_STOCK),
    criticalStock: this.fb.control(DEFAULT_CRITICAL_STOCK),
    inventoryDate: this.fb.control(this.todayChileDate)
  });

  readonly categories: { value: InventoryCategory; label: string }[] = [
    { value: 'materia_prima', label: 'Materia Prima' },
    { value: 'salsas_gourmet', label: 'Salsas gourmet' },
    { value: 'bebestibles', label: 'Bebestibles' },
    { value: 'materiales_desechables', label: 'Materiales desechables' },
    { value: 'frutas', label: 'Frutas' },
    { value: 'utiles_aseo', label: 'Útiles de aseo' }
  ];

  readonly categoryLabels: Record<string, string> = {
    materia_prima: 'Materia Prima', salsas_gourmet: 'Salsas gourmet', bebestibles: 'Bebestibles',
    materiales_desechables: 'Materiales desechables', frutas: 'Frutas', utiles_aseo: 'Útiles de aseo'
  };

  readonly categoryIcons: Record<string, string> = {
    materia_prima: 'bakery_dining', salsas_gourmet: 'lunch_dining', bebestibles: 'local_cafe',
    materiales_desechables: 'inventory_2', frutas: 'spa', utiles_aseo: 'cleaning_services'
  };

  @ViewChild('deleteModal') deleteModal!: ModalComponent;
  @ViewChild('toast') toast!: ToastComponent;

  editingItem?: InventoryItem;
  private deletingItem?: InventoryItem;

  get isEditing(): boolean {
    return !!this.editingItem;
  }

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

    const inventoryDate = raw.inventoryDate || this.todayChileDate;

    if (this.editingItem) {
      this.data.updateInventoryItem(this.editingItem.id, {
        name: raw.name.trim(),
        quantity: raw.quantity.trim(),
        unit: raw.unit || DEFAULT_UNIT,
        category: raw.category,
        minStock: Number(raw.minStock) || 10,
        criticalStock: Number(raw.criticalStock) || 5,
        inventoryDate,
        recordedByUser
      });
    } else {
      this.data.addInventoryItem({
        name: raw.name.trim(),
        quantity: raw.quantity.trim(),
        unit: raw.unit || DEFAULT_UNIT,
        category: raw.category,
        minStock: Number(raw.minStock) || 10,
        criticalStock: Number(raw.criticalStock) || 5,
        inventoryDate,
        recordedByUser
      });
    }

    this.resetForm();
  }

  editItem(item: InventoryItem): void {
    this.editingItem = item;
    this.form.patchValue({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || DEFAULT_UNIT,
      category: item.category,
      minStock: String(item.minStock ?? 10),
      criticalStock: String(item.criticalStock ?? 5),
      inventoryDate: item.inventoryDate || this.todayChileDate
    });
    
    // Al hacer click en ajustar, hacemos scroll hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      quantity: '',
      category: DEFAULT_CATEGORY,
      unit: DEFAULT_UNIT,
      minStock: DEFAULT_MIN_STOCK,
      criticalStock: DEFAULT_CRITICAL_STOCK,
      inventoryDate: this.todayChileDate
    });
    this.editingItem = undefined;
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

  toggleReorder(): void {
    this.reorderEnabled = !this.reorderEnabled;
    if (!this.reorderEnabled) {
      this.reorderGroups = null;
    } else {
      this.reorderGroups = null;
      this.countEnabled = false;
    }
  }

  toggleCountMode(): void {
    this.countEnabled = !this.countEnabled;
    if (this.reorderEnabled) {
      this.reorderEnabled = false;
      this.reorderGroups = null;
    }
  }

  onDrop(event: CdkDragDrop<InventoryItem[]>, category: string): void {
    const prev = event.previousIndex;
    const curr = event.currentIndex;
    if (prev === curr) return;
    moveItemInArray(event.container.data, prev, curr);
    const orders = event.container.data.map((item, idx) => ({
      id: item.id,
      sortOrder: idx + 1
    }));
    this.data.reorderInventory(orders);
  }

  toggleCounted(item: InventoryItem): void {
    if (item.countedAt) {
      this.data.markInventoryUncounted(item.id);
    } else {
      this.data.markInventoryCounted(item.id);
    }
  }

  updateInlineQuantity(item: InventoryItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = input.value.trim();
    if (newQuantity !== '' && newQuantity !== item.quantity) {
      this.data.updateInventoryItem(item.id, {
        name: item.name,
        quantity: newQuantity,
        unit: item.unit,
        category: item.category,
        minStock: item.minStock ?? 10,
        criticalStock: item.criticalStock ?? 5,
        inventoryDate: this.todayChileDate,
        recordedBy: item.recordedBy,
        recordedByUser: item.recordedByUser
      });
    }
  }

  resetCounts(): void {
    this.data.resetInventoryCounts();
  }

  sendWhatsApp(): void {
    const items = this.data.inventorySnapshot;
    const text = this.exportSvc.generateWhatsAppText([
      { title: 'AGOTADOS', icon: '❌', items: items.filter(i => parseQuantity(i.quantity) === 0) },
      { title: 'STOCK CRÍTICO', icon: '⚠️', items: items.filter(i => { const q = parseQuantity(i.quantity); return q > 0 && q <= (i.criticalStock ?? 5); }) },
      { title: 'STOCK BAJO', icon: '🔄', items: items.filter(i => { const q = parseQuantity(i.quantity); return q <= (i.minStock ?? 10) && q > (i.criticalStock ?? 5); }) }
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

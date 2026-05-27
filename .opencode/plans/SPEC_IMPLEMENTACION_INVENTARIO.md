# Especificación Técnica — Reordenamiento + Conteo Diario

## Resumen

Implementar dos features en AuraStøck:
1. **Reordenamiento drag-and-drop** de productos dentro de cada categoría
2. **Modo conteo diario** (checklist) para inventario

**Stack:** Angular 18.2 standalone + Express 5 + MySQL (`mysql2/promise`, raw SQL, `multipleStatements: false`)

---

## Feature 1: Reordenamiento de productos

### Backend — DB Schema

**Archivo:** `APII/API/aurastock_schema.sql` — en `CREATE TABLE inventory_items`, después de `category ENUM(...) NOT NULL DEFAULT 'materia_prima',`:
```sql
sort_order INT DEFAULT 0,
counted_at TIMESTAMP NULL DEFAULT NULL,
```

### Backend — Migraciones

**Archivo:** `APII/API/index.js` — agregar al bloque de migraciones, DESPUÉS de la migración de `inventory_date`:

```javascript
// Migración: columna sort_order
try {
  const migSort = await db.mysqlquery(
    `ALTER TABLE inventory_items ADD COLUMN sort_order INT DEFAULT 0 AFTER category`
  );
  if (migSort.success) {
    console.log('✓ Migración sort_order OK');
    const migSortOrder = await db.mysqlquery(
      `UPDATE inventory_items i
       JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY category ASC, name ASC) AS rn FROM inventory_items) AS o
       ON i.id = o.id SET i.sort_order = o.rn`
    );
    if (migSortOrder.success) console.log('✓ Orden inicial asignado');
    else console.warn('⚠ Asignación orden inicial:', migSortOrder.error);
  } else if (migSort.error?.includes('Duplicate column')) {
    console.log('→ sort_order ya existe');
  } else {
    console.warn('⚠ Migración sort_order:', migSort.error);
  }
} catch (e) {
  if (e.message?.includes('Duplicate column')) console.log('→ sort_order ya existe');
  else console.warn('⚠ Migración sort_order (no crítica):', e.message);
}

// Migración: columna counted_at
try {
  const migCount = await db.mysqlquery(
    `ALTER TABLE inventory_items ADD COLUMN counted_at TIMESTAMP NULL DEFAULT NULL AFTER sort_order`
  );
  if (migCount.success) console.log('✓ Migración counted_at OK');
  else if (migCount.error?.includes('Duplicate column')) console.log('→ counted_at ya existe');
  else console.warn('⚠ Migración counted_at:', migCount.error);
} catch (e) {
  if (e.message?.includes('Duplicate column')) console.log('→ counted_at ya existe');
  else console.warn('⚠ Migración counted_at (no crítica):', e.message);
}
```

### Backend — Service (`APII/API/services/inventory.services.js`)

**mapInventoryRow** — agregar campos:
```javascript
const mapInventoryRow = (row) => ({
    id: row.id,
    name: row.name,
    quantity: String(row.quantity ?? ''),
    unit: row.unit,
    category: row.category,
    minStock: row.min_stock ?? 10,
    criticalStock: row.critical_stock ?? 5,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    recordedBy: row.recorded_by,
    recordedByUser: row.recorded_by_user ?? null,
    inventoryDate: row.inventory_date || null,
    sortOrder: row.sort_order ?? 0,
    countedAt: row.counted_at || null
});
```

**findAll** — cambiar ORDER BY:
```javascript
// ANTES:
query += ' ORDER BY name ASC';
// DESPUÉS:
query += ' ORDER BY sort_order ASC, name ASC';
```

**create** — en los VALUES del INSERT, agregar `sort_order`. El array de columnas debe ser:
```sql
INSERT INTO inventory_items
(id, tenant_id, branch_id, name, quantity, unit, category, sort_order, min_stock, critical_stock, recorded_by, recorded_by_user, inventory_date)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```
Y en values array, después de `data.category`, agregar:
```javascript
data.sortOrder ?? 0,
```

**Nuevo método `reorder`:**
```javascript
async reorder(orders, tenantId) {
    if (!Array.isArray(orders) || orders.length === 0) {
        return { success: false, status: 400, error: 'Se requiere un array de órdenes' };
    }
    try {
        const cases = orders.map(() => 'WHEN ? THEN ?').join(' ');
        const ids = orders.flatMap(o => [o.id, o.sortOrder]);
        const query = `UPDATE inventory_items SET sort_order = CASE id ${cases} END WHERE tenant_id = ?`;
        const results = await db.mysqlquery(query, [...ids, tenantId]);
        if (!results.success) throw new Error(results.error);
        return { success: true, status: 200, error: null };
    } catch (error) {
        return { success: false, status: 500, error: 'Error al reordenar productos' };
    }
},
```

**Nuevo método `markCounted`:**
```javascript
async markCounted(id, tenantId) {
    const query = 'UPDATE inventory_items SET counted_at = NOW() WHERE id = ? AND tenant_id = ?';
    try {
        const results = await db.mysqlquery(query, [id, tenantId]);
        if (!results.success) throw new Error(results.error);
        return { success: true, status: 200, error: null };
    } catch (error) {
        return { success: false, status: 500, error: 'Error al marcar producto como contado' };
    }
},
```

**Nuevo método `markUncounted`:**
```javascript
async markUncounted(id, tenantId) {
    const query = 'UPDATE inventory_items SET counted_at = NULL WHERE id = ? AND tenant_id = ?';
    try {
        const results = await db.mysqlquery(query, [id, tenantId]);
        if (!results.success) throw new Error(results.error);
        return { success: true, status: 200, error: null };
    } catch (error) {
        return { success: false, status: 500, error: 'Error al desmarcar producto' };
    }
},
```

**Nuevo método `resetCounts`:**
```javascript
async resetCounts(tenantId, branchId) {
    let query = 'UPDATE inventory_items SET counted_at = NULL WHERE tenant_id = ?';
    const params = [tenantId];
    if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
    }
    try {
        const results = await db.mysqlquery(query, params);
        if (!results.success) throw new Error(results.error);
        return { success: true, status: 200, error: null };
    } catch (error) {
        return { success: false, status: 500, error: 'Error al reiniciar conteo' };
    }
},
```

### Backend — Routes (`APII/API/routes/inventory.routes.js`)

ORDEN IMPORTANTE: rutas fijas ANTES que rutas con `:id`:

```javascript
router.get('/', requireAuth, async (req, res) => {
    const response = await service.findAll(req.tenantId, req.branchId);
    res.status(response.status).json(response);
});

router.put('/reorder', requireAuth, async (req, res) => {
    const { orders } = req.body;
    const response = await service.reorder(orders, req.tenantId);
    res.status(response.status).json(response);
});

router.post('/reset-counts', requireAuth, async (req, res) => {
    const response = await service.resetCounts(req.tenantId, req.branchId);
    res.status(response.status).json(response);
});

router.post('/', requireAuth, validateBody(inventorySchema), async (req, res) => {
    const response = await service.create(req.body, req.tenantId, req.branchId);
    res.status(response.status).json(response);
});

router.put('/:id', requireAuth, validateBody(inventorySchema), async (req, res) => {
    const response = await service.update(req.params.id, req.body, req.tenantId);
    res.status(response.status).json(response);
});

router.delete('/:id', requireAuth, async (req, res) => {
    const response = await service.delete(req.params.id, req.tenantId);
    res.status(response.status).json(response);
});

router.post('/:id/count', requireAuth, async (req, res) => {
    const response = await service.markCounted(req.params.id, req.tenantId);
    res.status(response.status).json(response);
});

router.delete('/:id/count', requireAuth, async (req, res) => {
    const response = await service.markUncounted(req.params.id, req.tenantId);
    res.status(response.status).json(response);
});
```

### Backend — Validation (`APII/API/middleware/validate.js`)

En `inventorySchema`, agregar field opcional:
```javascript
sortOrder: Joi.number().integer().min(0).optional(),
```

---

### Frontend — Instalar dependencia

```bash
cd mi_app/angular
npm install @angular/cdk
```

### Frontend — Modelo (`mi_app/angular/src/app/core/models/inventory-item.model.ts`)

```typescript
export interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  unit: InventoryUnit;
  category: InventoryCategory;
  minStock: number;
  criticalStock: number;
  tenantId?: string;
  branchId?: string;
  recordedBy?: string;
  recordedByUser?: string | null;
  inventoryDate?: string | null;
  sortOrder?: number;
  countedAt?: string | null;
}
```

### Frontend — Data Service (`mi_app/angular/src/app/core/services/data.service.ts`)

```typescript
reorderInventory(orders: { id: string; sortOrder: number }[]): void {
  this.http.put(`${this.API_URL}inventory/reorder`, { orders }, { headers: this.getAuthHeaders() })
    .subscribe({ next: () => this.fetchInventory() });
}

markInventoryCounted(id: string): void {
  this.http.post(`${this.API_URL}inventory/${id}/count`, {}, { headers: this.getAuthHeaders() })
    .subscribe({ next: () => this.fetchInventory() });
}

markInventoryUncounted(id: string): void {
  this.http.delete(`${this.API_URL}inventory/${id}/count`, { headers: this.getAuthHeaders() })
    .subscribe({ next: () => this.fetchInventory() });
}

resetInventoryCounts(): void {
  this.http.post(`${this.API_URL}inventory/reset-counts`, {}, { headers: this.getAuthHeaders() })
    .subscribe({ next: () => this.fetchInventory() });
}
```

### Frontend — Componente TS (`inventory.component.ts`)

**Imports a cambiar:**

```typescript
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
```

**Decorador @Component — imports:**
```typescript
imports: [CommonModule, ReactiveFormsModule, ModalComponent, ToastComponent, CdkDropList, CdkDropListGroup, CdkDrag],
```

**Nuevas propiedades:**
```typescript
reorderEnabled = false;
countEnabled = false;
private reorderGroups: { category: string; label: string; items: InventoryItem[] }[] | null = null;
```

**Nuevos métodos:**
```typescript
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

resetCounts(): void {
  this.data.resetInventoryCounts();
}
```

**Modificar vm$ pipe — forma completa:**
```typescript
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
```

### Frontend — HTML (`inventory.component.html`)

**Toolbar actualizado (reemplazar el bloque `.list__toolbar`):**
```html
<div class="list__toolbar">
  <button type="button" class="toolbar-btn" (click)="sendWhatsApp()">
    <span class="material-symbols-outlined">chat</span>
    <span>Pedido WhatsApp</span>
  </button>
  <button type="button" class="toolbar-btn" (click)="downloadExcel()">
    <span class="material-symbols-outlined">download</span>
    <span>Descargar Excel</span>
  </button>
  <button type="button" class="toolbar-btn" [class.toolbar-btn--active]="reorderEnabled" (click)="toggleReorder()">
    <span class="material-symbols-outlined">swap_vert</span>
    <span>{{ reorderEnabled ? 'Listo' : 'Reordenar' }}</span>
  </button>
  <button type="button" class="toolbar-btn" [class.toolbar-btn--active]="countEnabled" (click)="toggleCountMode()">
    <span class="material-symbols-outlined">fact_check</span>
    <span>{{ countEnabled ? 'Salir conteo' : 'Conteo diario' }}</span>
  </button>
</div>
```

**Count panel (agregar antes del `<div *ngFor="let group of vm.groups">`):**
```html
<div class="count-panel" *ngIf="countEnabled">
  <div class="count-panel__header">
    <span class="material-symbols-outlined">checklist</span>
    <span>Conteo diario</span>
  </div>
  <div class="count-panel__stats">
    <strong>{{ vm.filteredCounted }}/{{ vm.totalItems }}</strong> productos contados
    <span class="count-panel__pct">({{ vm.countProgress }}%)</span>
  </div>
  <div class="count-progress">
    <div class="count-progress__fill" [style.width.%]="vm.countProgress"></div>
  </div>
  <button type="button" class="toolbar-btn toolbar-btn--danger" (click)="resetCounts()">
    <span class="material-symbols-outlined">refresh</span>
    <span>Reiniciar conteo</span>
  </button>
</div>
```

**Lista con drag-drop (reemplazar `<ul class="list">`):**
```html
<ul class="list"
    cdkDropList
    [cdkDropListData]="group.items"
    (cdkDropListDropped)="onDrop($event, group.category)"
    [class.list--reorder]="reorderEnabled">
  <li *ngFor="let item of group.items; trackBy: trackById"
      cdkDrag
      [class.critical]="isLowStock(item)"
      [class.out-of-stock]="isOutOfStock(item)"
      [class.counted]="item.countedAt != null && countEnabled">
    <div class="list__icon">
      <span class="material-symbols-outlined">
        {{ isOutOfStock(item) ? 'cancel' : isLowStock(item) ? 'warning' : 'check_circle' }}
      </span>
    </div>
    <div class="list__content">
      <strong>{{ item.name }}</strong>
      <span>{{ item.quantity }}{{ item.unit ? ' ' + item.unit : '' }}</span>
      <small *ngIf="item.minStock != null">Mín: {{ item.minStock }}</small>
      <small *ngIf="item.recordedByUser">Registrado por: {{ item.recordedByUser }}</small>
    </div>

    <!-- Modo reordenar: drag handle -->
    <div class="list__actions" *ngIf="reorderEnabled">
      <div class="drag-handle" cdkDragHandle>
        <span class="material-symbols-outlined">drag_indicator</span>
      </div>
    </div>

    <!-- Modo normal: editar/eliminar -->
    <div class="list__actions" *ngIf="!reorderEnabled && !countEnabled">
      <button type="button" class="list__action" (click)="editItem(item)">
        <span class="material-symbols-outlined">edit</span>
        <span>Ajustar</span>
      </button>
      <button type="button" class="list__action list__action--delete" (click)="deleteItem(item)">
        <span class="material-symbols-outlined">delete</span>
        <span>Eliminar</span>
      </button>
    </div>

    <!-- Modo conteo: botón circular -->
    <div class="list__actions" *ngIf="countEnabled && !reorderEnabled">
      <button type="button"
              class="count-btn"
              [class.count-btn--checked]="item.countedAt"
              (click)="toggleCounted(item); $event.stopPropagation()">
        <span class="material-symbols-outlined">
          {{ item.countedAt ? 'check_circle' : 'radio_button_unchecked' }}
        </span>
      </button>
    </div>
  </li>
</ul>
```

### Frontend — CSS (`inventory.component.css`)

Agregar al final del archivo:

```css
/* ── Modo reordenar ── */
.drag-handle {
  cursor: grab;
  touch-action: none;
  display: grid;
  place-items: center;
  min-width: 48px;
  min-height: 48px;
  color: #94a3b8;
  border-radius: 12px;
  transition: background 0.15s;
}

.drag-handle:hover {
  background: rgba(148, 163, 184, 0.15);
}

.drag-handle:active {
  cursor: grabbing;
}

.cdk-drag-placeholder {
  opacity: 0.25;
}

.cdk-drag-preview {
  border-radius: 1.5rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  background: var(--ee-surface);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.cdk-drag-animating {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

.list.cdk-drop-list-dragging .cdk-drag {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

.list--reorder li {
  cursor: grab;
}

.list--reorder li:active {
  cursor: grabbing;
}

.toolbar-btn--active {
  background: var(--ee-primary);
  color: var(--ee-surface);
  border-color: var(--ee-primary);
}

/* ── Count panel ── */
.count-panel {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.06), rgba(210, 105, 30, 0.06));
  border-radius: 1.5rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.count-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.count-panel__stats {
  font-size: 0.95rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

.count-panel__pct {
  color: #94a3b8;
  font-size: 0.85rem;
}

.count-progress {
  background: #e2e8f0;
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.count-progress__fill {
  height: 100%;
  background: linear-gradient(135deg, var(--ee-primary), var(--ee-accent));
  border-radius: 999px;
  transition: width 0.3s ease;
  min-width: 0;
}

/* ── Count button ── */
.count-btn {
  min-width: 52px;
  min-height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2.5px solid #cbd5e1;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #94a3b8;
  touch-action: manipulation;
}

.count-btn:hover {
  border-color: var(--ee-accent);
  color: var(--ee-accent);
  background: rgba(210, 105, 30, 0.08);
}

.count-btn--checked {
  border-color: #16a34a;
  background: #16a34a;
  color: white;
}

.count-btn--checked:hover {
  background: #15803d;
  border-color: #15803d;
  color: white;
}

.count-btn .material-symbols-outlined {
  font-size: 1.5rem;
}

/* ── Counted item ── */
.counted {
  opacity: 0.55;
}

.counted .count-btn--checked {
  opacity: 1;
}

.toolbar-btn--danger {
  border-color: #ef4444;
  color: #dc2626;
}

.toolbar-btn--danger:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .list li {
    grid-template-columns: 1fr;
  }

  .list li:has(.count-btn) {
    grid-template-columns: auto 1fr auto;
  }
}
```

---

## Reglas de negocio

1. **Mutua exclusión**: No se puede estar en reorder y count mode simultáneamente. Activando uno se desactiva el otro.
2. **Persistencia**: El orden y los conteos persisten en DB (no en localStorage).
3. **Cache local en reorder**: Al entrar a reorder mode, se clonan los grupos localmente para que CDK pueda mutar el array sin interferencia del observable.
4. **Nuevos productos**: Se crean con `sort_order = 0` (aparecen al inicio si no se ha reordenado la categoría, o al final si se ha reordenado porque los productos reordenados tienen sort_order 1, 2, 3...).
5. **Re-fetch**: Toda mutación (reorder, count toggle, reset) gatilla `fetchInventory()` que actualiza el BehaviorSubject.

---

## Verificación post-implementación

1. `npm install @angular/cdk` se ejecutó sin errores
2. El servidor backend inicia sin errores (migraciones OK)
3. Al hacer GET /api/inventory, los items vienen con `sortOrder` y `countedAt`
4. PUT /api/inventory/reorder funciona con array de `{id, sortOrder}`
5. POST /api/inventory/:id/count setea `counted_at` y DELETE lo resetea
6. POST /api/inventory/reset-counts pone todos los `counted_at = NULL`
7. En el frontend, en reorder mode se puede arrastrar items dentro de una categoría
8. En count mode, los botones circulares marcan/desmarcan items correctamente
9. La barra de progreso se actualiza al marcar items
10. En mobile (< 768px), el drag y conteo funcionan con touch
11. `ng build` compila sin errores

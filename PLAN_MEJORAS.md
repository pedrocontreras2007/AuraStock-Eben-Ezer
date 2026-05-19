# PLAN DE MEJORAS — AURASTØCK PARA EBEN EZER

> Generado: 19/05/2026
> Objetivo: Adaptar plataforma a Eben Ezer (churrería, Coquimbo), priorizando uso móvil y exportaciones rápidas.

---

## ESTADO ACTUAL

| Aspecto | Estado |
|---|---|
| Login (multi-tenant + JWT) | ✅ |
| Inventario (97 items, 5 categorías) | ✅ |
| Dashboard (KPI, charts, calendario) | ✅ |
| Producción | 🟡 Vacía (sin datos) |
| Alertas de stock | ✅ |
| Mermas | ✅ (código SVG chart muerto) |
| Reportes | ✅ |
| Diseño responsive | 🟡 Parcial — sin menú colapsable |
| UX diálogos | ⚠️ Usa `window.prompt()` y `window.confirm()` |
| Branding | 🟡 Genérico (AuraStøck), sin identidad Eben Ezer |

---

## FASE 1 — UX CRÍTICA

### 1.1 Modal reutilizable
- Crear `shared/components/modal.component.ts` (Angular standalone)
- Reemplazar `window.prompt()` en `adjustQuantity()` del inventario
- Reemplazar `window.confirm()` en losses
- Agregar confirmación en harvest (hoy no tiene)
- 🗂️ `inventory.component.ts`, `losses.component.ts`, `harvest.component.ts`

### 1.2 Botón eliminar en inventario
- Crear método `deleteInventoryItem()` en `data.service.ts`
- Botón "Eliminar" con confirmación modal en cada item
- 🗂️ `inventory.component.html`, `inventory.component.ts`, `data.service.ts`

### 1.3 Eliminar código SVG muerto en Losses
- ~40 líneas de TS que arman un SVG chart no renderizado
- 🗂️ `losses.component.ts`

### 1.4 Limpiar CSS muerto
- Clases sin uso en template: `summary-grid`, `profit-chart`, `profit`, `harvest-insights`, `badge__safe`
- 🗂️ `dashboard.component.css`, `reports.component.css`, `stock-alerts.component.css`

---

## FASE 2 — MOBILE + BRANDING

### 2.1 Navegación mobile-first
- `< 768px`: bottom navigation bar fija (5 iconos: Panel, Prod, Inv, Alertas, Mermas)
- Ocultar header en móvil, logo minimalista
- 🗂️ `main-layout.component.html`, `main-layout.component.css`

### 2.2 Calendario responsive
- Móvil: celdas de 90px → 48px, ocultar textos
- 🗂️ `dashboard.component.css`

### 2.3 Branding Eben Ezer
- Logo propio, paleta cálida (ocre, café, crema), favicon
- 🗂️ `login.component.*`, `main-layout.component.*`, `styles.css`, `index.html`

### 2.4 Ajustes responsive generales
- 360-480px: forms full-width, botones 44px+, tablas con scroll-x
- 🗂️ Todos los componentes (revisar media queries existentes)

---

## FASE 3 — UX MEJORAS

### 3.1 Skeleton loading
- `loading$` en DataService, skeleton cards mientras carga
- 🗂️ `data.service.ts` + todos los componentes

### 3.2 Toast notificaciones
- Servicio + componente toast (éxito verde, error rojo)
- Reemplazar `error: () => {}` silenciosos
- 🗂️ `shared/components/toast.component.ts`, `data.service.ts`

### 3.3 Búsqueda por nombre en inventario
- Input de texto junto al filtro de categoría
- Filtrar por `item.name.toLowerCase().includes(query)`
- 🗂️ `inventory.component.html`, `inventory.component.ts`

### 3.4 Modal edición completa inventario
- Nombre, cantidad, unidad, categoría, stock mínimo, stock crítico
- PUT completo del item al guardar
- 🗂️ `inventory.component.ts`, `inventory.component.html`

---

## FASE 3.5 — EXPORTACIONES (ALTA PRIORIDAD)

### 3.5 Botón "Enviar pedido por WhatsApp" (TXT)

**Ubicación:** Inventario + Alertas

**Formato del texto generado:**
```
🧾 EBEN EZER — PEDIDO DE INSUMOS
📅 19/05/2026

❌ AGOTADOS:
• Leche condensada — 0 unidades

⚠️ STOCK CRÍTICO:
• Aceite — 3 litros (mín: 20)

🔄 STOCK BAJO:
• Vasos café chicos — 0 uni (mín: 100)
```

**Flujo:**
1. Botón "📱 Pedido WhatsApp"
2. Genera texto con items agotados → críticos → bajo stock
3. Copia al portapapeles automáticamente
4. Toast: "✅ Texto copiado — pégalo en WhatsApp"
5. Opcional: `<textarea>` para revisar antes de copiar

**Lógica de filtrado:**
- `quantity === 0` → AGOTADOS
- `quantity <= criticalStock` → CRÍTICO
- `quantity <= minStock` → STOCK BAJO
- Solo items de categoría `insumo` y `relleno`

**Archivos:**
- `shared/services/export.service.ts` (NUEVO)
- `inventory.component.html` → botón
- `inventory.component.ts` → llamar servicio
- `inventory.component.css` → estilo botón

### 3.6 Exportar a Excel (XLSX)

**Ubicación:** Inventario + Reportes

**Columnas del archivo:**

| Producto | Categoría | Cantidad | Unidad | Stock Mín | Stock Crít | Estado | Faltante |
|---|---|---|---|---|---|---|---|

**Faltante =** `max(0, minStock - quantity)`

**Implementación:**
```bash
npm install xlsx
```

- Método `downloadExcel(items, filename)` en `export.service.ts`
- Botón "📥 Descargar Excel" que descarga el `.xlsx`
- En Reportes: Excel con resumen general + inventario completo

**Archivos:**
- `shared/services/export.service.ts`
- `inventory.component.html` → botón Excel
- `reports.component.html` → botón Excel resumen

---

## FASE 4 — POLISH

### 4.1 Página de producción
- Estado vacío amigable con instrucciones
- 🗂️ `harvest.component.*`

### 4.2 Componentes compartidos
- `app-button`, `app-card`, `app-empty-state`, `app-modal`
- 🗂️ `shared/components/*`

### 4.3 Exportar reportes (PDF/CSV)
- Botón "Exportar CSV" simple
- 🗂️ `reports.component.*`

### 4.4 Filtros por rango de fechas
- Inputs desde/hasta en reportes y mermas
- 🗂️ `reports.component.*`, `losses.component.*`

---

## CRONOGRAMA (13 días)

```
Día 1  → 1.1 Modal reutilizable + reemplazar prompt/confirm ✅
Día 2  → 1.2 Botón eliminar inventario ✅
Día 3  → 1.3 + 1.4 Limpiar código muerto ✅
Día 4  → 2.1 Nav mobile + bottom bar ✅
Día 5  → 2.2 Calendario + 2.4 Ajustes responsive ✅
Día 6  → 2.3 Branding Eben Ezer ✅
Día 7  → 3.1 Skeleton loading (loading$ en DataService) ✅
Día 8  → 3.2 Toast notificaciones ✅
Día 9  → 3.5 WhatsApp TXT ← ALTA ✅
Día 10 → 3.6 Excel XLSX ← ALTA ✅
Día 11 → 3.3 Búsqueda + 3.4 Modal edición (ajuste) ✅
Día 12 → 4.1 Producción (empty state) + 4.2 Componentes compartidos (modal/toast) ✅
Día 13 → 4.3 Exportar reportes (Excel) + 4.4 Filtros fecha ✅
```

---

## ARCHIVOS A CREAR

```
shared/services/export.service.ts          → WhatsApp TXT + Excel XLSX
shared/components/modal.component.ts       → Modal reutilizable
shared/components/modal.component.html
shared/components/modal.component.css
shared/components/toast.component.ts       → Toast notificaciones
shared/components/toast.component.html
shared/components/toast.component.css
shared/components/empty-state.component.ts → Estado vacío unificado
shared/components/empty-state.component.html
shared/components/empty-state.component.css
```

## ARCHIVOS A MODIFICAR

| Archivo | Cambios |
|---|---|
| `inventory.component.ts` | Modal prompt, delete, búsqueda, WhatsApp, Excel |
| `inventory.component.html` | Botones WhatsApp + Excel + eliminar + buscador |
| `inventory.component.css` | Estilos nuevos |
| `losses.component.ts` | Eliminar SVG chart muerto |
| `harvest.component.ts` | Confirmación delete |
| `main-layout.component.html` | Bottom nav mobile |
| `main-layout.component.css` | Estilos nav |
| `dashboard.component.css` | CSS muerto, calendario mobile |
| `reports.component.ts` | Excel + filtros |
| `reports.component.css` | CSS muerto |
| `stock-alerts.component.css` | CSS muerto |
| `login.component.*` | Branding |
| `data.service.ts` | deleteInventoryItem, loading state |
| `styles.css` | Variables color Eben Ezer |
| `index.html` | Favicon, título |

---

## NOTAS TÉCNICAS

| Área | Stack |
|---|---|
| Frontend | Angular 18 standalone, RxJS, Router lazy |
| Backend | Node + Express 5, JWT auth |
| DB | TiDB Cloud (MySQL compatible) |
| Deploy | Render (API) + Vercel (frontend) |
| Íconos | Material Symbols Outlined |
| Charts | ng2-charts (Chart.js) |
| Estilos | CSS plano con BEM (sin Tailwind/SCSS) |
| Excel | SheetJS (`npm install xlsx`) |
| WhatsApp | Solo clipboard API (nativa del browser) |

# PLAN DE REDISEÑO FRONTEND — EBEN EZER

> Generado: 19/05/2026
> Objetivo: Unificar look & feel, paleta cálida 100%, eliminar CSS muerto, pulir responsive y micro-interacciones.

---

## DIAGNÓSTICO

La app está "a medio pintar": login y layout usan la nueva paleta cálida (ocre/café/crema), pero el resto de componentes (Dashboard, Mermas, Alertas, Reportes, Harvest, Modal, Toast) siguen con los colores verde/azul originales. Además hay CSS muerto, secciones sin estilos y brechas responsive.

**Puntaje estético actual: 2.3 / 5**

---

## PALETA OBJETIVO

```css
--ee-primary: #8B4513;       /* Café principal */
--ee-primary-dark: #5C2E0B;  /* Café oscuro */
--ee-accent: #D2691E;        /* Ocre / naranja quemado */
--ee-cream: #FFF8F0;         /* Fondo crema */
--ee-cream-dark: #F5E6D0;    /* Crema oscuro / borde */
--ee-text: #3E2505;          /* Texto café oscuro */
```

---

## FASE 1 — UNIFICAR PALETA CÁLIDA

### 1.1 Dashboard
- Reemplazar `#1565c0` → `var(--ee-accent)` en toda la hoja
- Reemplazar `#2e7d32` → `var(--ee-primary)`
- Reemplazar `#0f172a` → `var(--ee-text)`
- Actualizar gradients de barras y fondos de cards
- 🗂️ `dashboard.component.css`

### 1.2 Losses / Mermas
- Migrar todos los colores a variables CSS
- Eliminar ~84 líneas de SVG donut chart muerto
- 🗂️ `losses.component.css`

### 1.3 Stock Alerts
- Migrar a paleta cálida
- Agregar `.badge__low` que falta en CSS
- 🗂️ `stock-alerts.component.css`

### 1.4 Harvest / Producción
- Migrar colores restantes (iconos, fondos list item)
- Agregar estilo para `.btn-delete`
- 🗂️ `harvest.component.css`

### 1.5 Reports
- Migrar metric cards, chips, summary, empty state
- 🗂️ `reports.component.css`

### 1.6 Modal
- Botón confirmar: rojo `#c0392b` → `var(--ee-accent)`
- Input focus: rojo → `var(--ee-accent)`
- Cancelar: gris → `var(--ee-cream-dark)`
- 🗂️ `modal.component.css`

### 1.7 Toast
- Migrar de inline styles a CSS variables
- Éxito: `var(--ee-primary)`, Error: `#b71c1c`
- 🗂️ `toast.component.ts`

---

## FASE 2 — CSS MUERTO Y SECCIONES SIN ESTILO

### 2.1 Dashboard
- Eliminar `.summary-card` duplicado (líneas 45-53, 552-589)
- Eliminar `.action-card` icon colors legacy (líneas 740-759)
- Agregar `.dashboard__zero-stock` (template lo usa, CSS no existe)
- 🗂️ `dashboard.component.css`

### 2.2 Reports
- Agregar estilos para `.production-insights-*` (hoy sin CSS, renderizan raw HTML)
- 🗂️ `reports.component.css`

### 2.3 Login
- Agregar `.tenant-btn`, `.tenant-list`, `.tenant-icon`, `.back-btn` (hoy sin estilo)
- 🗂️ `login.component.css`

### 2.4 Stock Alerts
- Agregar `.badge__low` (template lo usa, CSS no existe)
- Eliminar sombra pesada `0 20px 40px` de list items
- 🗂️ `stock-alerts.component.css`

### 2.5 Inventory
- Agregar `.out-of-stock` class CSS (template lo usa)
- 🗂️ `inventory.component.css`

---

## FASE 3 — MOBILE POLISH

### 3.1 Breakpoint 480px
- Agregar `@media (max-width: 480px)` en cada componente
- Forms: padding más grande en inputs para touch
- Cards: padding reducir de 2rem → 1.25rem
- Tablas: scroll-x forzado (hoy solo global)

### 3.2 Bottom bar
- Texto: 0.6rem → 0.7rem
- Iconos: 1.3rem → 1.4rem
- Active indicator: barra superior en vez de solo color

### 3.3 Modal responsive
- En móvil: 92% width, padding reducido
- Botones full-width apilados

### 3.4 Calendar mobile
- En vez de ocultar eventos, mostrar círculo indicador (•)
- 🗂️ `dashboard.component.css`

---

## FASE 4 — MICRO-INTERACCIONES Y POLISH

### 4.1 Global
- Agregar `box-sizing: border-box` en `styles.css`
- Unificar `transition: 0.2s ease` en todos los interactive elements

### 4.2 Toast mejorado
- Sombra + slide animation
- Auto-focus dismiss
- Soporte para cola de toasts

### 4.3 Modal mejorado
- Auto-focus en input al abrir
- Cerrar con tecla Escape
- Trap focus dentro del modal

### 4.4 Dashboard KPIs
- Tooltips suaves en hover
- Iconos decorativos con color brand

### 4.5 List items
- Hover con escala sutil (transform: scale(1.01))
- Transición en background

---

## CRONOGRAMA ESTIMADO

```
Fase 1 — Unificar paleta       ~3h
Fase 2 — CSS muerto + faltante  ~2h
Fase 3 — Mobile polish          ~1.5h
Fase 4 — Micro-interacciones    ~1.5h
Total                          ~8h (~1 día)
```

## ARCHIVOS A MODIFICAR

| Archivo | Fases |
|---|---|
| `dashboard.component.css` | 1.1, 2.1, 3.4, 4.4, 4.5 |
| `losses.component.css` | 1.2 |
| `stock-alerts.component.css` | 1.3, 2.4 |
| `harvest.component.css` | 1.4 |
| `reports.component.css` | 1.5, 2.2 |
| `modal.component.css` | 1.6, 3.3, 4.3 |
| `toast.component.ts` | 1.7, 4.2 |
| `login.component.css` | 2.3 |
| `inventory.component.css` | 2.5, 4.5 |
| `styles.css` | 4.1 |
| `main-layout.component.css` | 3.2 |

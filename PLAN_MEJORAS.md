# PLAN DE REDISEÑO FRONTEND — EBEN EZER (V2: MOBILE-FIRST & UI ELEGANTE)

> Generado: 20/05/2026
> Objetivo: Crear una interfaz verdaderamente profesional, comenzando con una arquitectura Mobile-First y un Design System sólido, para luego iterar sobre los componentes.

---

## FASE 1: DESIGN SYSTEM Y FUNDAMENTOS (GLOBAL)
**Establecer las reglas del juego para todo el sistema antes de tocar los componentes.**

### 1.1 Variables CSS Completas
- Expandir paleta cálida (primarios, acentos, fondos, estados, superficies).
- Variables tipográficas y de espaciado.
- Elevaciones (sombras suaves) para profundidad.
- 🗂️ `styles.css`

### 1.2 Áreas Seguras (Safe Areas) y Reset
- Implementar `env(safe-area-inset-bottom)` y `env(safe-area-inset-top)`.
- Global `box-sizing: border-box`.
- 🗂️ `styles.css`

### 1.3 Touch Targets (Accesibilidad)
- Todo elemento clickable (botones, actions, inputs) debe tener un `min-height: 48px`.
- 🗂️ `styles.css`

---

## FASE 2: LAYOUT BASE Y NAVEGACIÓN
**Mejorar la estructura que contiene a las vistas.**

### 2.1 Mobile Bottom Bar
- Rediseñar con backdrop-filter (glassmorphism) si es posible.
- Ajustar área segura inferior.
- Transiciones suaves en el estado activo.
- 🗂️ `main-layout.component.css`

### 2.2 Desktop Layout
- Contenedor flexible con `max-width: 1200px` y `margin: 0 auto;`.
- Adaptar layout para aprovechar el espacio horizontal sin deformar las vistas.
- 🗂️ `main-layout.component.css`

---

## FASE 3: REFACTORIZACIÓN VISUAL DE COMPONENTES
**Inyectar la paleta cálida y adaptar el CSS heredado.**

### 3.1 Dashboard & Reportes
- Paleta cálida (reemplazar verdes/azules).
- Tarjetas flotantes y fluidas.
- Limpieza de CSS muerto.
- 🗂️ `dashboard.component.css`, `reports.component.css`

### 3.2 Tablas e Inventario
- Comportamiento responsive robusto (`overflow-x: auto` en contenedores de tabla).
- 🗂️ `inventory.component.css`

### 3.3 Formularios, Alertas, Mermas y Cosecha
- Limpiar CSS muerto.
- Aplicar `border-radius` sutil (8-12px).
- Fokus state coherente.
- 🗂️ `losses.component.css`, `harvest.component.css`, `stock-alerts.component.css`

### 3.4 Modales
- Padding reducido en móvil, 90%-95% width.
- 🗂️ `modal.component.css`, (Revisar global si aplica)

---

## FASE 4: MICRO-INTERACCIONES Y FEEDBACK
**Pulir detalles para la sensación de app nativa.**

### 4.1 Global
- Transición general `transition: all 0.2s ease-out` o enfocada a transform/background.

### 4.2 Toast y Respuestas
- Sombra y slide animation.
- Desde abajo en móvil, esquina en PC.
- 🗂️ `toast.component.ts` (si tiene CSS inline) / `global`

### 4.3 Detalles extra
- Empty states con texto y color adecuado.
- Hover states en desktop sutiles (escala o sombra extra).

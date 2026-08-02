# 🗺️ FRONTEND ROADMAP — LogisticsPro ERP

Este documento establece el plan de trabajo por fases para la optimización, modernización visual y robustecimiento del Frontend de **LogisticsPro ERP**, alineado con los estándares definidos en las skills `.agents/skills/frontend-design/SKILL.md` y `.agents/skills/shadcn-ui-expert/SKILL.md`.

---

## 🚀 Fase 1: Quick Wins (Correcciones Inmediatas)

Mejoras de bajo esfuerzo que resuelven pequeñas inconsistencias y elevan la usabilidad percibida sin alterar arquitectura.

### Tarea 1.1: Estandarización de Notificaciones Toasts y Retroalimentación de Acciones
- **Prioridad**: Alta
- **Dificultad**: Fácil
- **Tiempo estimado**: 3h
- **Archivos afectados**:
  - `frontend/src/app/(app)/trips/page.tsx`
  - `frontend/src/app/(app)/maintenance/page.tsx`
  - `frontend/src/components/trips/TripModal.tsx`
  - `frontend/src/components/maintenance/WorkOrderModal.tsx`
- **Dependencias**: `shadcn-ui-expert` (`useToast` hook)

### Tarea 1.2: Feedback Visual en Estados de Guardado (Buttons Loading State)
- **Prioridad**: Alta
- **Dificultad**: Fácil
- **Tiempo estimado**: 2h
- **Archivos afectados**:
  - `frontend/src/components/trips/TripModal.tsx`
  - `frontend/src/components/trips/WaybillModal.tsx`
  - `frontend/src/components/maintenance/SparePartModal.tsx`
  - `frontend/src/components/users/UserModal.tsx`
- **Dependencias**: `shadcn-ui-expert` (Button CVA variants)

### Tarea 1.3: Formateo Unificado de Moneda y Distancias
- **Prioridad**: Media
- **Dificultad**: Fácil
- **Tiempo estimado**: 2h
- **Archivos afectados**:
  - `frontend/src/lib/utils.ts`
  - `frontend/src/app/(app)/billing/page.tsx`
  - `frontend/src/app/(app)/reports/page.tsx`
  - `frontend/src/components/trips/modal-sections/FinancialsSection.tsx`
- **Dependencias**: Ninguna

---

## 🎨 Fase 2: Mejoras Visuales (Visual Polish & Estética Premium)

Adopción completa de los referentes visuales **Linear / Stripe / Vercel** manteniendo consistencia con los tokens de `globals.css`.

### Tarea 2.1: Rediseño de Stat Cards y Dashboards con Glassmorphism Acentuado
- **Prioridad**: Alta
- **Dificultad**: Media
- **Tiempo estimado**: 5h
- **Archivos afectados**:
  - `frontend/src/app/globals.css`
  - `frontend/src/app/(app)/dashboard/page.tsx`
  - `frontend/src/app/(app)/vehicles/page.tsx`
  - `frontend/src/app/(app)/carriers/page.tsx`
- **Dependencias**: `frontend-design` (Design Tokens)

### Tarea 2.2: Sistema Unificado de Badges Operacionales
- **Prioridad**: Media
- **Dificultad**: Fácil
- **Tiempo estimado**: 3h
- **Archivos afectados**:
  - `frontend/src/app/globals.css`
  - `frontend/src/app/(app)/trips/page.tsx`
  - `frontend/src/app/(app)/maintenance/page.tsx`
  - `frontend/src/app/(app)/drivers/page.tsx`
- **Dependencias**: `shadcn-ui-expert` (StatusBadge pattern)

### Tarea 2.3: Mejoras de Contraste y Pulido en Modo Oscuro (Dark Mode)
- **Prioridad**: Media
- **Dificultad**: Media
- **Tiempo estimado**: 4h
- **Archivos afectados**:
  - `frontend/src/app/globals.css`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/app/login/page.tsx`
- **Dependencias**: `frontend-design` (Dark mode tokens)

---

## ⚡ Fase 3: UX (Experiencia de Usuario)

Optimización de la interacción diaria para despachadores y supervisores de operaciones.

### Tarea 3.1: Command Menu Global (Cmd + K / Ctrl + K)
- **Prioridad**: Alta
- **Dificultad**: Media
- **Tiempo estimado**: 6h
- **Archivos afectados**:
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/CommandMenu.tsx` [NUEVO]
  - `frontend/src/app/(app)/layout.tsx`
- **Dependencias**: `shadcn-ui-expert` (`Command` dialog component)

### Tarea 3.2: Confirmaciones de Salida en Formularios Modificados (Dirty Forms)
- **Prioridad**: Alta
- **Dificultad**: Media
- **Tiempo estimado**: 4h
- **Archivos afectados**:
  - `frontend/src/components/trips/TripModal.tsx`
  - `frontend/src/components/trips/WaybillModal.tsx`
  - `frontend/src/components/maintenance/WorkOrderModal.tsx`
- **Dependencias**: `shadcn-ui-expert` (`Dialog` / React Hook Form `isDirty`)

### Tarea 3.3: Componentes de Estados Vacíos (Empty States) e Ilustraciones Informativas
- **Prioridad**: Media
- **Dificultad**: Fácil
- **Tiempo estimado**: 4h
- **Archivos afectados**:
  - `frontend/src/components/ui/EmptyState.tsx` [NUEVO]
  - `frontend/src/app/(app)/carriers/page.tsx`
  - `frontend/src/app/(app)/dangerous-goods/page.tsx`
  - `frontend/src/app/(app)/documents/page.tsx`
- **Dependencias**: `shadcn-ui-expert` (Empty state pattern)

---

## 📱 Fase 4: Responsive (Mobile-First & Adaptabilidad)

Garantizar operatividad 100% fluida en smartphones y tablets utilizadas en campo por choferes y playeros.

### Tarea 4.1: Vista de Cards Apiladas para Tablas en Pantallas Móviles (< 640px)
- **Prioridad**: Alta
- **Dificultad**: Media
- **Tiempo estimado**: 8h
- **Archivos afectados**:
  - `frontend/src/app/(app)/trips/page.tsx`
  - `frontend/src/app/(app)/vehicles/page.tsx`
  - `frontend/src/app/(app)/maintenance/page.tsx`
- **Dependencias**: `shadcn-ui-expert` (Responsive Data Tables)

### Tarea 4.2: Optimización de Targets Táctiles (Touch Targets ≥ 44px)
- **Prioridad**: Media
- **Dificultad**: Fácil
- **Tiempo estimado**: 3h
- **Archivos afectados**:
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/app/globals.css`
- **Dependencias**: `frontend-design` (WCAG AA Target Sizes)

---

## 🏎️ Fase 5: Performance (Rendimiento & Escala)

Asegurar tiempos de respuesta instantáneos incluso con miles de viajes y registros concurrentes.

### Tarea 5.1: Virtualización de Tablas de Alta Densidad (TanStack Virtual)
- **Prioridad**: Alta
- **Dificultad**: Difícil
- **Tiempo estimado**: 10h
- **Archivos afectados**:
  - `frontend/src/app/(app)/trips/page.tsx`
  - `frontend/src/app/(app)/gps/page.tsx`
  - `frontend/package.json`
- **Dependencias**: `shadcn-ui-expert` (Data Table architecture)

### Tarea 5.2: Code Splitting y Carga Diferida (Dynamic Imports)
- **Prioridad**: Alta
- **Dificultad**: Media
- **Tiempo estimado**: 5h
- **Archivos afectados**:
  - `frontend/src/app/(app)/trips/page.tsx`
  - `frontend/src/app/(app)/dashboard/page.tsx`
  - `frontend/src/app/(app)/reports/page.tsx`
- **Dependencias**: Ninguna

---

## ♿ Fase 6: Accesibilidad (WCAG AA & Inclusión)

Garantizar cumplimiento normativo de accesibilidad y navegabilidad por teclado.

### Tarea 6.1: Anillos de Enfoque Teclado Visibles (Focus Visible Rings)
- **Prioridad**: Alta
- **Dificultad**: Fácil
- **Tiempo estimado**: 3h
- **Archivos afectados**:
  - `frontend/src/app/globals.css`
  - `frontend/src/components/ui/`
- **Dependencias**: `frontend-design` (WCAG AA Focus)

### Tarea 6.2: Etiquetas Accesibles en Botones de Solo Ícono (aria-label audit)
- **Prioridad**: Media
- **Dificultad**: Fácil
- **Tiempo estimado**: 3h
- **Archivos afectados**:
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/trips/BatchTripModal.tsx`
  - `frontend/src/components/maintenance/SparePartModal.tsx`
- **Dependencias**: `frontend-design` (Accessibility Guidelines)

---

## 📊 Cuadro Resumen del Roadmap

| Fase | Tareas | Horas Est. | Nivel de Riesgo | Beneficio Clave |
|------|--------|------------|-----------------|-----------------|
| **Fase 1: Quick Wins** | 3 | 7h | Bajo | Correcciones inmediatas de UX y feedback |
| **Fase 2: Mejoras Visuales** | 3 | 12h | Bajo | Apariencia premium tipo Linear/Vercel |
| **Fase 3: UX** | 3 | 14h | Medio | Navegación ultra-rápida (Cmd+K) y seguridad en datos |
| **Fase 4: Responsive** | 2 | 11h | Medio | Operatividad móvil completa en campo |
| **Fase 5: Performance** | 2 | 15h | Alto | Escalabilidad masiva (>1000 registros sin lag) |
| **Fase 6: Accesibilidad** | 2 | 6h | Bajo | Cumplimiento estándar WCAG AA |
| **TOTAL** | **15** | **65h** | - | **Sistema ERP de Nivel Enterprise** |

---

## 📌 Guía de Invocación para Agentes Frontend

Cualquier agente que ejecute tareas de este roadmap debe invocar y cumplir:
1. `frontend-design` (`.agents/skills/frontend-design/SKILL.md`) para verificar reglas visuales.
2. `shadcn-ui-expert` (`.agents/skills/shadcn-ui-expert/SKILL.md`) para aplicar la implementación técnica de componentes.

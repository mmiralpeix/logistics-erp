---
name: frontend-design
description: >
  Directivas de diseño visual premium para LogisticsPro ERP. Combina las instrucciones originales
  de Anthropic "frontend-design" con las reglas específicas del proyecto (React + TypeScript,
  TailwindCSS, shadcn/ui). Se activa automáticamente ante cualquier tarea de creación o
  modificación de interfaz de usuario.
license: Apache 2.0 — complete terms in LICENSE.txt (upstream: anthropics/skills)
---

# Frontend Design — LogisticsPro ERP

> **Origen**: [anthropics/skills/frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
> Adaptado al Design System y stack tecnológico de LogisticsPro ERP.

---

## Parte 1 — Instrucciones Originales de Anthropic (preservadas íntegramente)

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

### Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before — use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

### Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

### Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

### Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it — a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

### More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it. Being specific is always better than being clever.

Use active voice as default. A control should say exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each element do exactly one job. A label labels, an example demonstrates, and nothing quietly does double duty.

---

## Parte 2 — Reglas Específicas para LogisticsPro ERP

### 2.1 Stack Obligatorio

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Lenguaje | **TypeScript** (strict) | No se permite JavaScript puro en componentes |
| Framework | **React 18 + Next.js 14** (App Router) | Todas las páginas bajo `frontend/src/app/(app)/` |
| Estilos | **TailwindCSS 3.x** | Solo clases utilitarias de Tailwind y las clases del Design System definidas en `globals.css` |
| Componentes UI | **shadcn/ui** (cuando disponible) | Priorizar componentes de shadcn/ui sobre implementaciones custom |
| Fuente | **Inter** (400, 500, 600, 700) | Ya importada en `globals.css` |

### 2.2 Estética y Referentes Visuales

La estética de LogisticsPro ERP toma como referentes:

- **Linear** → Claridad extrema, uso generoso de espacio negativo, tipografía limpia
- **Stripe** → Jerarquía visual impecable, separación clara de secciones con bordes sutiles
- **Vercel** → Dark mode premium, transiciones suaves, micro-animaciones con propósito
- **Notion** → Densidad informativa elegante, componentes modulares, UX predecible

**Regla cardinal**: Cada pantalla debe sentirse como parte de un producto unificado de clase mundial. Si una interfaz parece "hecha con un template", ha fallado.

### 2.3 Design System — Tokens Únicos (NO introducir nuevos)

El Design System está definido en `frontend/src/app/globals.css`. Los tokens vigentes son:

```
Fondos:    --bg-primary, --bg-secondary, --bg-card
Bordes:    --border-color
Texto:     --text-primary, --text-secondary
Acentos:   --accent-blue, --accent-green, --accent-yellow, --accent-red, --accent-purple
```

**Clases del sistema**: `.card`, `.stat-card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.table-header`, `.table-row`, `.badge-*`, `.page-title`, `.section-title`, `.modal-overlay`, `.modal`

> ⚠️ **PROHIBIDO**: Inventar nuevos colores, variables CSS o clases fuera del Design System existente. Si se necesita un nuevo token, debe proponerse como adición al sistema en `globals.css` con justificación.

### 2.4 Consistencia Entre Pantallas

- Todas las páginas deben seguir el mismo patrón estructural:
  - Header con `.page-title` + acciones primarias a la derecha
  - Filtros/búsqueda debajo del header
  - Tabla o grid de contenido principal
  - Modales para creación/edición (usando `.modal-overlay` + `.modal`)
- Los componentes reutilizables viven en `frontend/src/components/`
- Las secciones de formulario modulares en `frontend/src/components/<module>/modal-sections/`

### 2.5 Responsive por Defecto

- **Mobile-first**: Todo layout debe funcionar desde 320px
- Breakpoints de Tailwind: `sm:`, `md:`, `lg:`, `xl:`
- Tablas en móvil → vista de cards apiladas o scroll horizontal
- Sidebar colapsable ya implementada (drawer en móvil, sidebar fija en desktop)
- Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` para stat-cards

### 2.6 Accesibilidad (WCAG AA)

- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande
- Todos los elementos interactivos deben tener `focus:ring-2 focus:ring-blue-500/50`
- Usar `aria-label`, `aria-describedby`, `role` donde corresponda
- Respetar `prefers-reduced-motion` → usar `motion-safe:` prefix de Tailwind
- Semántica HTML: `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>`
- Labels visibles en todos los inputs de formularios

### 2.7 Componentes Reutilizables

Antes de crear un componente nuevo, verificar si ya existe uno similar en:
1. `frontend/src/components/` (componentes del proyecto)
2. `frontend/src/app/globals.css` (clases utilitarias)

Si un patrón se usa en 2+ lugares, debe extraerse a un componente reutilizable.

### 2.8 Priorizar Claridad para Operaciones Logísticas

La interfaz está dirigida a operadores logísticos, despachadores y gerentes de flota. Esto implica:

- **Datos densos con jerarquía clara**: Tablas con columnas bien priorizadas, badges de estado con colores semánticos consistentes
- **Estados operacionales prominentes**: Los estados de viajes, vehículos y OTs deben ser inmediatamente reconocibles
- **Acciones contextuales rápidas**: Botones de acción inline en filas de tabla, no escondidos en menús
- **Vocabulario del dominio**: Usar terminología del transporte argentino (Carta de Porte, VTV, RUTA, OT, etc.)
- **Sin ambigüedad**: Cada dato numérico debe tener su unidad (km, hs, $, lts)

### 2.9 Protocolo de Verificación Pre-Commit

Antes de dar por terminada cualquier modificación de UI:

1. ✅ ¿Usa exclusivamente tokens del Design System?
2. ✅ ¿Funciona en mobile (320px) y desktop (1920px)?
3. ✅ ¿Los estados vacíos tienen copy orientador?
4. ✅ ¿Los errores son específicos y accionables?
5. ✅ ¿Se respeta el layout pattern de la aplicación?
6. ✅ ¿Los nuevos componentes son reutilizables?
7. ✅ ¿Pasa `npx tsc --noEmit` sin errores?

---

## Parte 3 — Cómo Invocar Esta Skill

Esta skill se activa **automáticamente** cuando el agente detecta tareas relacionadas con:
- Creación de nuevas páginas o vistas
- Modificación de componentes UI existentes
- Diseño de modales, formularios o dashboards
- Revisión de estética o UX

Para invocación manual explícita, indicar en el prompt:
```
Usar la skill "frontend-design" para esta tarea.
```

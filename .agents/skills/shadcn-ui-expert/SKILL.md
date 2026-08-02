---
name: shadcn-ui-expert
description: >
  Skill experta en shadcn/ui para LogisticsPro ERP. Enseña y aplica automáticamente el uso correcto
  de todos los componentes de shadcn/ui, composición, variants con CVA, formularios con React Hook Form + Zod,
  Data Tables, estados de carga/vacío/error, dark mode y responsive design.
  Especializada en interfaces empresariales de gestión logística.
---

# shadcn/ui Expert — LogisticsPro ERP

> **Fuente**: Creada desde cero basándose en la documentación oficial de [shadcn/ui](https://ui.shadcn.com/docs).
> No existe skill equivalente en el repositorio de Anthropic. Adaptada al stack y dominio de LogisticsPro ERP.

---

## 1. Filosofía de shadcn/ui

shadcn/ui **NO es una librería de componentes tradicional**. Es una colección de componentes reutilizables que se copian directamente al proyecto. Esto significa:

- **Propiedad total del código**: Los componentes viven en tu proyecto, no en `node_modules`
- **Personalización sin restricciones**: Se editan directamente, no se sobreescriben con props
- **Sin dependencias de versiones**: No hay upgrades que rompan compatibilidad
- **Composición sobre configuración**: Componentes pequeños que se componen para crear UI complejas

### Principios Fundamentales

1. **Composición** → Componentes pequeños y composables, no monolitos con 50 props
2. **Accesibilidad** → Basado en Radix UI primitives (WAI-ARIA compliant)
3. **Estilizado** → TailwindCSS + class-variance-authority (CVA) para variants
4. **Tipado** → TypeScript estricto con inferencia de props
5. **Ownership** → El código es tuyo, modifícalo según necesites

---

## 2. Estructura de Archivos en LogisticsPro ERP

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              ← Componentes shadcn/ui base (instalados vía CLI)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── layout/          ← Componentes de layout (Sidebar, Header)
│   │   ├── trips/           ← Componentes específicos del módulo Viajes
│   │   ├── vehicles/        ← Componentes específicos del módulo Flota
│   │   ├── maintenance/     ← Componentes específicos del módulo Mantenimiento
│   │   └── users/           ← Componentes específicos del módulo Usuarios
│   ├── lib/
│   │   ├── utils.ts         ← Función `cn()` para merge de clases
│   │   └── constants.ts     ← Constantes del proyecto
│   └── app/
│       └── globals.css      ← Design System tokens + Tailwind
```

### Convención de Nombres
- Componentes UI base: `kebab-case` (ej: `data-table.tsx`, `date-picker.tsx`)
- Componentes de dominio: `PascalCase` (ej: `TripModal.tsx`, `WorkOrderModal.tsx`)
- Carpeta `ui/` es exclusiva para componentes shadcn/ui. NO mezclar con lógica de negocio.

---

## 3. Función `cn()` — Merge Inteligente de Clases

La función `cn()` combina `clsx` + `tailwind-merge` para evitar conflictos de clases:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Uso correcto**:
```tsx
// ✅ Correcto - cn() resuelve conflictos de Tailwind
<div className={cn("px-4 py-2", isActive && "bg-blue-500", className)} />

// ❌ Incorrecto - template literals no resuelven conflictos
<div className={`px-4 py-2 ${isActive ? 'bg-blue-500' : ''} ${className}`} />
```

---

## 4. Variants con class-variance-authority (CVA)

CVA permite definir variantes tipadas para componentes:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Clases base
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700",
        secondary: "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Tipado del componente
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
```

### Reglas CVA para LogisticsPro ERP
- **Siempre** usar los colores del Design System (`--accent-blue`, `--accent-green`, etc.)
- Las variants deben alinearse con los estados operacionales del ERP:
  - `default` → Acción primaria (azul)
  - `destructive` → Eliminar, cancelar (rojo)
  - `outline` → Acción secundaria
  - `ghost` → Acciones terciarias, inline
  - `success` → Confirmación, aprobación (verde)
  - `warning` → Atención requerida (amarillo)

---

## 5. Componentes Core y su Uso en LogisticsPro

### 5.1 Dialog (Modales)

Para formularios de creación/edición de entidades (Viajes, OT, Vehículos):

```tsx
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Crear Nuevo Viaje</DialogTitle>
      <DialogDescription>
        Complete los datos del viaje. Los campos marcados con * son obligatorios.
      </DialogDescription>
    </DialogHeader>
    {/* Formulario */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
      <Button type="submit">Guardar viaje</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Reglas para modales en LogisticsPro**:
- Ancho máximo: `sm:max-w-2xl` para formularios estándar, `sm:max-w-4xl` para formularios complejos
- Siempre incluir `DialogDescription` para accesibilidad
- Overflow: `max-h-[90vh] overflow-y-auto`
- Footer: botón de cancelar (outline) a la izquierda, acción primaria a la derecha

### 5.2 Sheet (Panel Lateral)

Para filtros, detalles rápidos y vistas de panel:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4 mr-2" /> Filtros
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
    <SheetHeader>
      <SheetTitle>Filtros Avanzados</SheetTitle>
    </SheetHeader>
    {/* Contenido del filtro */}
  </SheetContent>
</Sheet>
```

### 5.3 Command (Búsqueda Global / Command Menu)

Para búsqueda rápida tipo Cmd+K:

```tsx
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList
} from "@/components/ui/command";

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Buscar viajes, vehículos, clientes..." />
  <CommandList>
    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
    <CommandGroup heading="Viajes">
      <CommandItem>
        <Truck className="mr-2 h-4 w-4" />
        <span>VJ-2024-0125 — Buenos Aires → Mendoza</span>
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Vehículos">
      <CommandItem>
        <Car className="mr-2 h-4 w-4" />
        <span>AB123CD — Scania G460</span>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### 5.4 Popover

Para selectores, calendarios y menús contextuales:

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Calendar className="mr-2 h-4 w-4" />
      {format(date, "dd/MM/yyyy")}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <CalendarComponent mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

### 5.5 Toast (Notificaciones)

Para feedback de acciones del usuario:

```tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// Éxito
toast({
  title: "Viaje creado",
  description: "El viaje VJ-2024-0125 fue creado exitosamente.",
});

// Error
toast({
  variant: "destructive",
  title: "Error al guardar",
  description: "No se pudo conectar con el servidor. Intente nuevamente.",
});
```

**Reglas de Toast en LogisticsPro**:
- Títulos cortos y en voz activa ("Viaje creado", no "El viaje ha sido creado exitosamente")
- Errores deben ser específicos y accionables
- Duración: 3s para éxito, 5s para errores
- Posición: `bottom-right`

---

## 6. Data Tables — Tablas con Miles de Registros

Las Data Tables en LogisticsPro manejan datasets grandes. Usar `@tanstack/react-table`:

```tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  ColumnDef, flexRender, getCoreRowModel,
  getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";

// Definición de columnas
const columns: ColumnDef<Trip>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Código <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("code")}</span>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "origin",
    header: "Origen",
  },
  {
    accessorKey: "destination",
    header: "Destino",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
```

### Patrones de Data Table para LogisticsPro

1. **Paginación server-side** para > 500 registros
2. **Filtros facetados** con badges de conteo
3. **Ordenamiento** por columna con indicador visual
4. **Selección múltiple** con checkbox para acciones batch
5. **Acciones inline** en la última columna (editar, eliminar, ver detalle)
6. **Exportar** a Excel/CSV con el dataset filtrado
7. **Búsqueda global** con debounce de 300ms

---

## 7. Formularios — React Hook Form + Zod

### Setup Base

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";

// Schema Zod
const tripFormSchema = z.object({
  origin: z.string().min(2, "El origen debe tener al menos 2 caracteres"),
  destination: z.string().min(2, "El destino debe tener al menos 2 caracteres"),
  clientId: z.string().uuid("Seleccione un cliente válido"),
  departureDate: z.date({ required_error: "Seleccione fecha de salida" }),
  vehicleId: z.string().uuid("Seleccione un vehículo"),
  driverId: z.string().uuid("Seleccione un conductor").optional(),
  cargoType: z.enum(["general", "peligrosa", "refrigerada", "granel"]),
  weight: z.number().positive("El peso debe ser mayor a 0").optional(),
  notes: z.string().max(500).optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

// Componente
export function TripForm({ onSubmit, defaultValues }: TripFormProps) {
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: defaultValues ?? {
      origin: "",
      destination: "",
      cargoType: "general",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origen *</FormLabel>
              <FormControl>
                <Input placeholder="Buenos Aires" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Más campos... */}
      </form>
    </Form>
  );
}
```

### Reglas de Formularios en LogisticsPro

- **Siempre** usar Zod para validación
- Mensajes de error en **español** y específicos del dominio
- Campos obligatorios marcados con `*` en el label
- Layouts de formulario: 2 columnas en desktop (`grid grid-cols-2 gap-4`), 1 columna en mobile
- Formularios largos divididos en **secciones con tabs o steps** (ver `modal-sections/`)
- Selects dependientes (ej: Provincia → Ciudad) con loading states

---

## 8. Estados de UI

### 8.1 Loading States (Skeletons)

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton para tabla
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" /> {/* Header */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// Skeleton para stat cards
function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
```

**Regla**: Siempre mostrar skeletons que imiten la forma del contenido real. Nunca un spinner genérico.

### 8.2 Empty States

```tsx
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

// Uso
<EmptyState
  icon={Truck}
  title="Sin viajes registrados"
  description="Cree su primer viaje para comenzar a gestionar sus operaciones logísticas."
  action={<Button>Crear primer viaje</Button>}
/>
```

**Reglas de Empty States**:
- Ícono contextual del módulo (no genéricos)
- Título que declare el estado ("Sin viajes registrados", no "No data")
- Descripción que invite a actuar
- CTA claro para resolver el estado vacío

### 8.3 Error States

```tsx
function ErrorState({
  title = "Error al cargar datos",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-red-50 dark:bg-red-500/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
        </Button>
      )}
    </div>
  );
}
```

**Reglas de Error States**:
- Explicar qué falló específicamente
- Ofrecer acción de reintento cuando sea posible
- No usar humor ni disculpas ("Oops!" ❌)
- Errores de red: "No se pudo conectar con el servidor"
- Errores de permisos: "No tiene permisos para ver este recurso"

---

## 9. Dark Mode

LogisticsPro ERP soporta dark mode. Reglas:

```tsx
// ✅ Correcto — usar las clases dark: de Tailwind
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">

// ✅ Correcto — usar CSS variables del Design System
<div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>

// ❌ Incorrecto — colores hardcodeados sin variante dark
<div className="bg-white text-black">

// ❌ Incorrecto — opacity inconsistente en dark mode
<div className="bg-blue-500/10">  // Usar dark:bg-blue-500/20 separado
```

### Reglas de Dark Mode
- **Siempre** proveer variante `dark:` para cada color de fondo, texto y borde
- Usar las variables CSS del Design System (ver `globals.css`)
- Bordes: `border-slate-200 dark:border-slate-700`
- Sombras: más sutiles en dark mode (`shadow-sm dark:shadow-card`)
- Badges: usar la paleta `dark:bg-{color}-500/20 dark:text-{color}-400`

---

## 10. Responsive Design

### Breakpoints

| Breakpoint | Tamaño | Uso en LogisticsPro |
|-----------|--------|---------------------|
| (default) | < 640px | Móvil — layout de 1 columna, sidebar oculta |
| `sm:` | ≥ 640px | Tablets pequeñas |
| `md:` | ≥ 768px | Tablets — grid de 2 columnas |
| `lg:` | ≥ 1024px | Desktop — sidebar visible, grid de 3 columnas |
| `xl:` | ≥ 1280px | Desktop grande — grid de 4 columnas |

### Patrones Responsive

```tsx
// Stat cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Formularios
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField /> <FormField />
  <FormField /> <FormField />
</div>

// Tablas en mobile → scroll horizontal
<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  <Table className="min-w-[800px]"> {/* Forzar ancho mínimo */}
    {/* ... */}
  </Table>
</div>
```

---

## 11. Componentes para Logística Empresarial

### 11.1 KPI Cards

```tsx
interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ElementType;
}

function KPICard({ title, value, unit, change, icon: Icon }: KPICardProps) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {change !== undefined && (
        <span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-600" : "text-red-500")}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs mes anterior
        </span>
      )}
    </div>
  );
}
```

### 11.2 Status Badges (Estados Operacionales)

```tsx
const statusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: "Pendiente",    className: "badge-yellow" },
  in_transit: { label: "En Tránsito",  className: "badge-blue" },
  delivered:  { label: "Entregado",    className: "badge-green" },
  cancelled:  { label: "Cancelado",    className: "badge-red" },
  delayed:    { label: "Demorado",     className: "badge-orange" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "badge-gray" };
  return <span className={config.className}>{config.label}</span>;
}
```

### 11.3 Timeline

```tsx
function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
      {events.map((event, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500" />
          <div className="text-sm">
            <span className="font-medium text-slate-900 dark:text-white">{event.title}</span>
            <span className="ml-2 text-slate-500 dark:text-slate-400">{event.timestamp}</span>
          </div>
          {event.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{event.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 11.4 Breadcrumbs

```tsx
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/trips">Viajes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>VJ-2024-0125</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## 12. Composición de Componentes — Patrones Avanzados

### Patrón: Componente con Sub-Componentes (Compound Pattern)

```tsx
// ✅ Composición correcta (shadcn style)
<Card>
  <CardHeader>
    <CardTitle>Resumen de Flota</CardTitle>
    <CardDescription>Estado actual de los vehículos</CardDescription>
  </CardHeader>
  <CardContent>
    <Table>...</Table>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Ver todo</Button>
  </CardFooter>
</Card>

// ❌ Anti-patrón: mega-componente con muchas props
<Card
  title="Resumen de Flota"
  description="Estado actual de los vehículos"
  content={<Table>...</Table>}
  footerButton={{ label: "Ver todo", variant: "outline" }}
/>
```

### Patrón: Composición de Dialog + Form

```tsx
function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<TripFormValues>({ resolver: zodResolver(tripFormSchema) });

  async function onSubmit(values: TripFormValues) {
    await createTrip(values);
    toast({ title: "Viaje creado" });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Nuevo viaje</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Viaje</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Secciones del formulario */}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar viaje"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 13. Checklist Pre-Implementación

Antes de crear o modificar un componente UI:

1. ✅ ¿Existe un componente shadcn/ui base que cubra este caso? → Usarlo
2. ✅ ¿Se usa `cn()` para merge de clases? → Nunca template literals
3. ✅ ¿Las variants están definidas con CVA? → No inline conditionals complejos
4. ✅ ¿Los formularios usan React Hook Form + Zod? → No validación manual
5. ✅ ¿Los estados vacío/carga/error están cubiertos? → No pantallas en blanco
6. ✅ ¿Funciona en dark mode? → Verificar variantes `dark:`
7. ✅ ¿Es responsive desde 320px? → Verificar breakpoints
8. ✅ ¿Los colores son del Design System? → No colores ad-hoc
9. ✅ ¿El componente es reutilizable? → Si se usa en 2+ lugares, extraer
10. ✅ ¿La composición sigue el compound pattern? → No mega-componentes

---

## 14. Compatibilidad con Skill `frontend-design`

Esta skill es **complementaria** a `frontend-design`. La relación es:

| Aspecto | `frontend-design` | `shadcn-ui-expert` |
|---------|-------------------|-------------------|
| Foco | Principios de diseño visual, estética, intencionalidad | Implementación técnica de componentes |
| Nivel | Estratégico (¿qué construir?) | Táctico (¿cómo construirlo?) |
| Tokens | Define los tokens del Design System | Consume los tokens en componentes |
| Accesibilidad | Establece el estándar WCAG AA | Implementa con Radix primitives |

**Flujo de trabajo**: Primero consultar `frontend-design` para definir la dirección visual, luego consultar `shadcn-ui-expert` para la implementación técnica.

---

## 15. Cómo Invocar Esta Skill

### Automáticamente
Se activa cuando el agente detecta:
- Creación de componentes UI nuevos
- Uso de shadcn/ui, CVA, React Hook Form o Zod
- Implementación de tablas, modales, formularios o estados

### Manualmente
```
Usar la skill "shadcn-ui-expert" para implementar este componente.
```

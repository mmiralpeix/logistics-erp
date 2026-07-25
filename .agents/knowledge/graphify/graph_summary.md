# Resumen del Grafo de Conocimiento y Dependencias (Graphify Index)

**Proyecto**: LogisticsPro ERP  
**Última Actualización**: Indexado inicial completo  
**Propósito**: Proporcionar contexto relacional inmediato a los agentes de IA para evitar escaneos de código innecesarios.

---

## 1. Mapeo de Entidades Relacionales (Prisma Models → DB)

| Modelo Prisma | Tabla PostgreSQL | Módulos Vinculados | Relaciones Principales |
| :--- | :--- | :--- | :--- |
| `User` | `users` | `auth`, `users` | `role`, `company`, `trips`, `driverProfile` |
| `Vehicle` | `vehicles` | `vehicles`, `trips`, `maintenance` | `trips`, `maintenances`, `fuelLogs`, `certifications` |
| `Driver` | `drivers` | `drivers`, `trips` | `user`, `trips`, `certifications` |
| `Client` | `clients` | `clients`, `trips`, `billing` | `contracts`, `trips`, `invoices` |
| `Trip` | `trips` | `trips`, `certifications`, `billing` | `vehicle`, `driver`, `client`, `contract`, `costs` |
| `Contract` | `contracts` | `clients`, `trips` | `client`, `trips` (baseTon, excessRate) |
| `Certification` | `certifications` | `certifications`, `trips` | `trip`, `vehicle`, `driver` (calculated excess ton) |
| `Maintenance` | `maintenances` | `maintenance`, `vehicles` | `vehicle`, `workOrder` |
| `FuelLog` | `fuel_logs` | `fuel`, `vehicles`, `drivers` | `vehicle`, `driver` |
| `Invoice` | `invoices` | `billing`, `clients` | `client`, `trips` |

---

## 2. Mapa de Módulos (Backend NestJS → Frontend Next.js)

```mermaid
graph LR
    subgraph Frontend Next.js
        F_Trips[frontend/src/app/(app)/trips]
        F_Vehicles[frontend/src/app/(app)/vehicles]
        F_Drivers[frontend/src/app/(app)/drivers]
        F_Clients[frontend/src/app/(app)/clients]
        F_Billing[frontend/src/app/(app)/billing]
        F_Maint[frontend/src/app/(app)/maintenance]
    end

    subgraph DTOs & API Contracts
        T_Types[frontend/src/types/api]
        B_DTOs[backend/src/modules/*/dto]
    end

    subgraph Backend NestJS
        B_Trips[backend/src/modules/trips]
        B_Vehicles[backend/src/modules/vehicles]
        B_Drivers[backend/src/modules/drivers]
        B_Clients[backend/src/modules/clients]
        B_Billing[backend/src/modules/billing]
        B_Maint[backend/src/modules/maintenance]
    end

    F_Trips --> T_Types --> B_DTOs --> B_Trips
    F_Vehicles --> T_Types --> B_DTOs --> B_Vehicles
    F_Drivers --> T_Types --> B_DTOs --> B_Drivers
    F_Clients --> T_Types --> B_DTOs --> B_Clients
    F_Billing --> T_Types --> B_DTOs --> B_Billing
    F_Maint --> T_Types --> B_DTOs --> B_Maint
```

---

## 3. Matriz de Dependencias por Módulo

### 🚚 Módulo: Viajes (`trips`)
- **Prisma**: `schema.prisma` → `model Trip`, `model TripCost`, `model Contract`
- **Backend Controller**: `backend/src/modules/trips/trips.controller.ts`
- **Backend Service**: `backend/src/modules/trips/trips.service.ts`
- **DTOs**: `backend/src/modules/trips/dto/create-trip.dto.ts`, `update-trip.dto.ts`
- **Frontend Page**: `frontend/src/app/(app)/trips/page.tsx`
- **Frontend Components**: `frontend/src/components/trips/TripModal.tsx`, `TripTable.tsx`, `GanttChart.tsx`
- **API Client**: `frontend/src/lib/api/trips.ts`

### 🚛 Módulo: Vehículos (`vehicles`)
- **Prisma**: `schema.prisma` → `model Vehicle`
- **Backend Controller**: `backend/src/modules/vehicles/vehicles.controller.ts`
- **Backend Service**: `backend/src/modules/vehicles/vehicles.service.ts`
- **DTOs**: `backend/src/modules/vehicles/dto/create-vehicle.dto.ts`
- **Frontend Page**: `frontend/src/app/(app)/vehicles/page.tsx`
- **Frontend Components**: `frontend/src/components/vehicles/VehicleModal.tsx`, `VehicleGrid.tsx`

### 👤 Módulo: Conductores (`drivers`)
- **Prisma**: `schema.prisma` → `model Driver`
- **Backend Controller**: `backend/src/modules/drivers/drivers.controller.ts`
- **Backend Service**: `backend/src/modules/drivers/drivers.service.ts`
- **Frontend Page**: `frontend/src/app/(app)/drivers/page.tsx`

### 🏢 Módulo: Clientes y Tarifa (`clients`)
- **Prisma**: `schema.prisma` → `model Client`, `model Contract`
- **Backend Controller**: `backend/src/modules/clients/clients.controller.ts`
- **Backend Service**: `backend/src/modules/clients/clients.service.ts`
- **Frontend Page**: `frontend/src/app/(app)/clients/page.tsx`

### 📜 Módulo: Certificaciones de Toneladas (`certifications`)
- **Prisma**: `schema.prisma` → `model Certification`
- **Backend Controller**: `backend/src/modules/certifications/certifications.controller.ts`
- **Backend Service**: `backend/src/modules/certifications/certifications.service.ts` (calcula exedente automático)

---

## 4. Instrucciones para la Consulta de los Agentes
1. Antes de realizar un `grep_search` masivo, ubicar en este documento la sección del módulo afectado.
2. Identificar los archivos clave listados (Prisma -> Service -> DTO -> Page -> Component).
3. Abrir o inspeccionar únicamente los archivos identificados.

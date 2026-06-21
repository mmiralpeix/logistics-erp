# LogisticsPro ERP

## Sistema de Gestión Logística Empresarial

Sistema ERP/TMS completo para empresas de transporte de cargas, minería, alquiler de equipos y distribución regional. Desarrollado con arquitectura moderna y stack tecnológico de primer nivel.

---

## INICIO RÁPIDO (Una sola vez)

### Windows (PowerShell)
```powershell
.\run.ps1
```

### Linux / macOS
```bash
chmod +x run.sh && ./run.sh
```

El script hace todo automáticamente:
1. Verifica Docker activo
2. Construye las imágenes
3. Levanta PostgreSQL, Redis, Backend y Frontend
4. Ejecuta migraciones y seed de datos
5. Abre el navegador en http://localhost:3000

---

## CREDENCIALES DE ACCESO

| Rol                  | Email                       | Contraseña  |
|----------------------|-----------------------------|-------------|
| Super Admin          | admin@logistics.com         | Admin123!   |
| Gerente Operaciones  | ops@logistics.com           | Ops123!     |
| Despachador          | despacho@logistics.com      | Ops123!     |
| Conductor            | chofer@logistics.com        | Driver123!  |
| Contaduría           | contaduria@logistics.com    | Ops123!     |

---

## ARQUITECTURA

### Decisión: Monolito Modular + Clean Architecture

**Justificación**: Para una empresa de 10-500 vehículos y 10-1000 viajes/mes, el monolito modular es superior a microservicios porque:
- Un solo deployment → menor overhead operativo
- Sin latencia de red entre módulos internos
- Transacciones ACID nativas entre módulos
- Escalable verticalmente hasta miles de usuarios/día
- Extracción a microservicios posible cuando el negocio lo justifique

```
┌─────────────────────────────────────────────────┐
│              FRONTEND (Next.js 14)              │
│  Dashboard │ Clientes │ Viajes │ Flota │ ...   │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/REST API
┌─────────────────▼───────────────────────────────┐
│              BACKEND (NestJS 10)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   Auth   │ │Dashboard │ │    Trips Module  │ │
│  │  (JWT)   │ │ (Stats)  │ │ (Gantt + Lead    │ │
│  └──────────┘ └──────────┘ │  Time Calculator)│ │
│  ┌──────────┐ ┌──────────┐ └──────────────────┘ │
│  │ Vehicles │ │ Drivers  │ ┌──────────────────┐ │
│  │  Module  │ │  Module  │ │ Dangerous Goods  │ │
│  └──────────┘ └──────────┘ │  (Compliance)    │ │
│  ┌──────────┐ ┌──────────┐ └──────────────────┘ │
│  │Maintenance│ │   Fuel   │ ┌──────────────────┐ │
│  │  Module  │ │  Module  │ │    GPS Module    │ │
│  └──────────┘ └──────────┘ │ (Teltonika/Traccar)│
│  ┌──────────┐ ┌──────────┐ └──────────────────┘ │
│  │ Billing  │ │ Reports  │ ┌──────────────────┐ │
│  │  Module  │ │ (Excel)  │ │   Alerts Module  │ │
│  └──────────┘ └──────────┘ │  (Cron Jobs)     │ │
│                             └──────────────────┘ │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              INFRAESTRUCTURA                    │
│  PostgreSQL 16 │ Redis 7 │ Docker Compose      │
└─────────────────────────────────────────────────┘
```

---

## STACK TECNOLÓGICO

| Capa        | Tecnología          | Versión |
|-------------|---------------------|---------|
| Backend     | NestJS              | 10.x    |
| Frontend    | Next.js             | 14.x    |
| Base datos  | PostgreSQL          | 16      |
| Cache       | Redis               | 7       |
| ORM         | Prisma              | 5.x     |
| Auth        | JWT + Passport      | -       |
| UI          | Tailwind CSS        | 3.x     |
| Charts      | Recharts            | 2.x     |
| Containers  | Docker + Compose    | -       |
| API Docs    | Swagger/OpenAPI     | 3.x     |

---

## MÓDULOS IMPLEMENTADOS

### 1. Dashboard Ejecutivo
- KPIs en tiempo real: viajes activos, facturación, costos, margen
- Gráficos de evolución mensual (área + barras)
- Distribución de estados de viajes (pie chart)
- Alertas de vencimientos próximos
- Viajes recientes con estado

### 2. Gestión de Clientes
- CRUD completo con CUIT, razón social, contactos múltiples
- Historial de viajes y facturas por cliente
- Categorización (Standard/Premium/VIP)
- Contratos y tarifas

### 3. Gestión de Vehículos
- Camiones, semirremolques, camionetas, equipos especiales, cisternas
- Control de documentación (seguro, ITV, RUTA) con alertas de vencimiento
- Seguimiento de kilometraje y horas de motor
- Estado en tiempo real (disponible/en viaje/en mantenimiento)

### 4. Gestión de Conductores
- Datos personales, CUIL, CBU
- Control de licencias por tipo (A, B, C, D, E)
- Habilitación para cargas peligrosas (Decreto 779/95)
- Exámenes médicos y psicofísicos con alertas
- Historial de viajes e incidentes

### 5. Planificación de Viajes con Gantt ★
**Algoritmo Lead Time Multidía:**
```
Lead Time Total = Duración Ruta + Espera en Destino + Descansos Conductor
ETA = Fecha Salida + Lead Time
```
- Vista Gantt semanal/quincenal con drag-and-drop visual
- Validación de conflictos (mismo vehículo/conductor en fechas superpuestas)
- Reprogramación automática con recálculo de ETA
- Estados: Pendiente → Programado → En Curso → Demorado/Finalizado
- Integración con carga peligrosa (bloquea si conductor no habilitado)

### 6. GPS en Tiempo Real
- Webhook para Teltonika, Garmin, Traccar
- Posición, velocidad y estado en tiempo real
- Integración preparada con Google Maps
- Geocercas (geofences)

### 7. Cargas Peligrosas (Decreto 779/95)
- N° ONU, clase de riesgo (1-9), grupo de embalaje
- Verificación de habilitación del conductor
- Checklist de documentación (hojas de seguridad, equipos obligatorios)
- Bloqueo de viaje si no cumple normativa

### 8. Mantenimiento de Flota
- Preventivo y correctivo
- Control por km, horas y tiempo
- Alertas automáticas (cron diario)
- Cambio automático de estado del vehículo
- Registro de costos por taller y repuestos

### 9. Control de Combustible
- Registro de cargas con precio, litros y proveedor
- Cálculo automático de rendimiento (km/L)
- **Detección de desvíos**: si rendimiento < 70% del promedio histórico → alerta automática
- Estadísticas por vehículo y período

### 10. Gestión Documental
- Carga de archivos (PDF, JPG, PNG, DOC)
- Vinculación con vehículos, conductores y viajes
- Control de vencimientos con alertas
- Tipos: seguro, ITV, RUTA, licencias, cartas de porte, remitos

### 11. Costos y Rentabilidad
- Costo real por viaje (combustible + peajes + viáticos + mantenimiento)
- Margen bruto por viaje
- Desglose por categoría de costo
- Análisis mensual

### 12. Facturación
- Facturas A, B, C, Remitos, Notas de Crédito
- Generación de número correlativo automático
- Control de estado (borrador/emitida/pagada/vencida/anulada)
- Preparado para integración AFIP/ARCA
- Estadísticas de cobranza

### 13. Reportes Excel
- Reporte de Viajes (con colores, totales y márgenes)
- Reporte de Flota (estado y documentación)
- Reporte de Combustible (consumos y desvíos)
- Exportación con filtros por fechas

---

## SEGURIDAD

- **RBAC** (Role-Based Access Control) con 7 roles
- **JWT** con expiración configurable
- **Rate limiting** (100 req/min por IP)
- **Auditoría** de acciones por usuario
- Passwords hasheados con bcrypt (salt 10)
- CORS configurado para frontend específico
- MFA preparado (speakeasy)

---

## API REST - ENDPOINTS PRINCIPALES

```
POST   /api/auth/login          # Login
GET    /api/auth/profile        # Perfil usuario

GET    /api/dashboard/stats     # KPIs generales
GET    /api/dashboard/monthly-chart
GET    /api/dashboard/expiring-alerts
GET    /api/dashboard/trip-distribution

GET    /api/clients             # Listar clientes
POST   /api/clients             # Crear cliente
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id

GET    /api/vehicles            # Listar flota
GET    /api/vehicles/expiring   # Documentos por vencer
GET    /api/vehicles/available  # Disponibles en fecha

GET    /api/drivers
GET    /api/drivers/expiring-licenses
GET    /api/drivers/available

GET    /api/trips               # Con filtros y paginación
POST   /api/trips               # Crear con validación de conflictos
GET    /api/trips/gantt         # Datos para vista Gantt
PATCH  /api/trips/:id/status
PATCH  /api/trips/:id/reschedule
POST   /api/trips/:id/costs

GET    /api/maintenance
GET    /api/maintenance/upcoming
GET    /api/fuel
GET    /api/fuel/deviations
GET    /api/fuel/stats

GET    /api/billing/invoices
POST   /api/billing/invoices
POST   /api/billing/invoices/from-trip

GET    /api/reports/trips/excel     # Descargar Excel
GET    /api/reports/fleet/excel
GET    /api/reports/fuel/excel

GET    /api/gps/positions
POST   /api/gps/webhook/:deviceId  # Webhook GPS

GET    /api/health               # Health check
```

**Documentación Swagger:** http://localhost:3000/api/docs

---

## DATOS DE PRUEBA INCLUIDOS

- **5 usuarios** con diferentes roles
- **4 clientes** reales (minería, distribución, petroquímica, construcción)
- **6 vehículos** (Scania, Mercedes-Benz, Volvo, Ford, Liebherr, Iveco)
- **4 conductores** con licencias y habilitaciones
- **5 viajes** en diferentes estados (incluyendo uno con carga peligrosa)
- **4 órdenes de mantenimiento**
- **5 cargas de combustible** (con 1 desvío detectado)
- **2 facturas** (1 pagada, 1 emitida)
- **3 dispositivos GPS** registrados
- **2 incidentes** registrados

---

## COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver solo logs del backend
docker compose logs -f backend

# Acceder a la DB
docker compose exec postgres psql -U logistics_user -d logistics_erp

# Ejecutar seed manualmente
docker compose exec backend node -e "require('./dist/prisma/seed')"

# Reiniciar solo el backend
docker compose restart backend

# Reset total (borra todos los datos)
.\run.ps1 -Reset          # Windows
./run.sh --reset          # Linux/macOS

# Detener el sistema
docker compose down

# Detener y eliminar volúmenes (reset de datos)
docker compose down -v
```

---

## ESTRUCTURA DEL PROYECTO

```
logistics-erp/
├── backend/                    # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema completo de BD
│   │   └── seed.ts             # Datos de prueba
│   ├── src/
│   │   ├── modules/            # Módulos de negocio
│   │   │   ├── auth/           # Autenticación JWT
│   │   │   ├── dashboard/      # KPIs y estadísticas
│   │   │   ├── clients/        # Gestión de clientes
│   │   │   ├── vehicles/       # Gestión de flota
│   │   │   ├── drivers/        # Gestión de conductores
│   │   │   ├── trips/          # Viajes + Gantt + Lead Time
│   │   │   ├── maintenance/    # Mantenimiento
│   │   │   ├── fuel/           # Combustible
│   │   │   ├── documents/      # Documentos
│   │   │   ├── costs/          # Costos y rentabilidad
│   │   │   ├── billing/        # Facturación
│   │   │   ├── reports/        # Excel exports
│   │   │   ├── gps/            # GPS / Tracking
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   └── alerts/         # Cron jobs de alertas
│   │   ├── common/
│   │   │   ├── decorators/     # @CurrentUser, @Roles, @Public
│   │   │   └── guards/         # JWT, Roles
│   │   ├── prisma/             # PrismaService
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── Dockerfile
│
├── frontend/                   # UI Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/          # Rutas protegidas
│   │   │   │   ├── dashboard/
│   │   │   │   ├── clients/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── drivers/
│   │   │   │   ├── trips/      # Lista + Vista Gantt
│   │   │   │   ├── maintenance/
│   │   │   │   ├── fuel/
│   │   │   │   ├── billing/
│   │   │   │   ├── reports/
│   │   │   │   ├── gps/
│   │   │   │   ├── users/
│   │   │   │   └── settings/
│   │   │   └── login/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Header
│   │   │   ├── clients/        # ClientModal
│   │   │   ├── vehicles/       # VehicleModal
│   │   │   ├── drivers/        # DriverModal
│   │   │   └── trips/          # TripModal, GanttView
│   │   └── lib/
│   │       ├── api.ts          # Cliente API tipado
│   │       ├── auth.ts         # Auth store (Zustand)
│   │       └── utils.ts        # Formatters y helpers
│   └── Dockerfile
│
├── docker-compose.yml          # Orquestación completa
├── run.ps1                     # Script Windows PowerShell
├── run.sh                      # Script Linux/macOS
└── README.md
```

---

## INTEGRACIONES DISPONIBLES

| Sistema       | Estado       | Configuración                          |
|---------------|--------------|----------------------------------------|
| Teltonika GPS | Webhook listo | POST /api/gps/webhook/:deviceId        |
| Garmin GPS    | Webhook listo | POST /api/gps/webhook/:deviceId        |
| Traccar       | Webhook listo | POST /api/gps/webhook/:deviceId        |
| Google Maps   | Preparado    | NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...    |
| AFIP/ARCA     | Preparado    | Estructura de factura lista            |
| Nodemailer    | Preparado    | Para notificaciones de alertas         |

---

## KUBERNETES (Producción)

```bash
# Prerequisitos: kubectl + kustomize instalados y cluster configurado

# Deploy completo
./k8s/deploy.sh production latest

# O manualmente con kustomize
kubectl apply -k ./k8s/

# Port forward para acceso local
kubectl port-forward svc/frontend-service 3000:3000 -n logistics-erp

# Ver estado de pods
kubectl get pods -n logistics-erp
kubectl get services -n logistics-erp

# Logs
kubectl logs -f deployment/backend -n logistics-erp
```

### Archivos k8s/
| Archivo | Descripción |
|---------|-------------|
| `namespace.yaml` | Namespace `logistics-erp` |
| `configmap.yaml` | Variables de configuración no sensibles |
| `secrets.yaml` | Credenciales (reemplazar antes de producción) |
| `postgres.yaml` | Deployment + PVC 20Gi + Service PostgreSQL |
| `redis.yaml` | Deployment + PVC 5Gi + Service Redis |
| `backend.yaml` | Deployment (2 réplicas) + HPA (2-6) + Service |
| `frontend.yaml` | Deployment (2 réplicas) + HPA (2-4) + Service |
| `ingress.yaml` | Nginx Ingress con TLS / versión local |
| `kustomization.yaml` | Orquestación con Kustomize |
| `deploy.sh` | Script de deploy automático |

---

## CI/CD — GitHub Actions

El pipeline `.github/workflows/ci-cd.yml` ejecuta automáticamente:

| Job | Trigger | Acciones |
|-----|---------|----------|
| `lint` | PR + push | TypeScript type check en backend y frontend |
| `test` | PR + push | Tests con PostgreSQL y Redis reales en CI |
| `build` | main + develop | Build y push de imágenes Docker a GHCR |
| `deploy-staging` | develop | Deploy al cluster de staging + smoke test |
| `deploy-production` | main | Deploy al cluster de producción |

**Secrets requeridos en GitHub:**
- `KUBECONFIG_STAGING` — kubeconfig base64 para staging
- `KUBECONFIG_PRODUCTION` — kubeconfig base64 para producción

---

## MFA (Autenticación de Dos Factores)

```
POST /api/auth/mfa/generate   # Genera QR para Google Authenticator
POST /api/auth/mfa/enable     # Activa MFA con primer código TOTP
POST /api/auth/mfa/disable    # Desactiva MFA (requiere contraseña)
```

Al hacer login con MFA activo, si no se incluye `totpToken`, la respuesta devuelve `{ mfaRequired: true }` y el frontend debe solicitar el código.

---

## ENDPOINTS ADICIONALES

```
GET    /api/dangerous-goods              # Listar declaraciones de cargas peligrosas
GET    /api/dangerous-goods/clases       # Tabla de clases de riesgo ONU (1-9)
GET    /api/dangerous-goods/compliance-check/:tripId  # Verificar cumplimiento
PATCH  /api/dangerous-goods/:id          # Actualizar declaración
PATCH  /api/dangerous-goods/:id/approve  # Aprobar permisos

GET    /api/documents/:id/download       # Descargar archivo adjunto
```

---

© 2024 LogisticsPro ERP — Sistema desarrollado con NestJS + Next.js + PostgreSQL

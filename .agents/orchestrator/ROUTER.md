# Router de Orquestación Agéntica (LogisticsPro ERP)

Este archivo define las reglas de ruteo dinámico para clasificar cualquier tarea entrante y determinar la secuencia óptima de agentes a ejecutar.

---

## 1. Clasificación de Tareas y Pipelines

### Pipeline: `feature` (Nueva funcionalidad / Módulo)
**Disparadores**: Palabras clave como "nueva funcionalidad", "nuevo módulo", "agregar pantalla", "crear entidad", "feature", "endpoint nuevo".
**Secuencia de Agentes**:
1. `architect` → Define especificación técnica, diagrama de datos y contratos.
2. `db-engineer` → Modifica `schema.prisma`, genera y aplica migración PostgreSQL.
3. `api-engineer` → Crea/actualiza DTOs NestJS (class-validator) y tipos API en frontend.
4. `backend-dev` → Implementa controladores, servicios, guardias y repositorios NestJS.
5. `frontend-dev` → Construye páginas, componentes React/Next.js y estado local.
6. `qa-engineer` → Escribe y ejecuta unit & integration tests para backend y frontend.
7. `playwright-tester` → Escribe y ejecuta specs E2E de la nueva funcionalidad.
8. `code-reviewer` → Audita Clean Code, duplicación y patrones de diseño.
9. `perf-analyst` → Revisa consultas SQL, re-renders e impacto en bundle.
10. `security-auditor` → Valida autenticación, autorización (RBAC), XSS/SQLi.
11. `doc-writer` → Actualiza README, Swagger/OpenAPI, diagramas y CHANGELOG.md.
12. `devops-engineer` → Valida containers Docker y scripts de despliegue si aplica.

---

### Pipeline: `bugfix` (Corrección de errores)
**Disparadores**: "bug", "error", "fallo", "fix", "excepción", "crash", "500", "404", "issue".
**Secuencia de Agentes**:
1. `qa-engineer` → Reproduce el fallo escribiendo un unit/integration test que falle (Red).
2. `backend-dev` o `frontend-dev` → Aplica la corrección mínima requerida (Green).
3. `qa-engineer` → Vuelve a ejecutar la suite para confirmar solución (Pass).
4. `code-reviewer` → Revisa que el fix no introduzca regresiones ni código spagetti.
5. `doc-writer` → Registra la corrección en `CHANGELOG.md`.

---

### Pipeline: `ui-polish` (Mejora visual o UX)
**Disparadores**: "diseño", "ui", "ux", "estilos", "responsive", "color", "modal", "layout", "css", "tailwind".
**Secuencia de Agentes**:
1. `frontend-dev` → Aplica los cambios estéticos y de experiencia de usuario.
2. `playwright-tester` → Verifica que no se rompan interacciones visuales ni componentes E2E.
3. `code-reviewer` → Revisa reutilización de tokens CSS y utilidades Tailwind.
4. `doc-writer` → Actualiza captura de pantalla o changelog si es relevante.

---

### Pipeline: `security-hardening` (Auditoría y Parches de Seguridad)
**Disparadores**: "seguridad", "vulnerabilidad", "jwt", "auth", "cors", "csrf", "sqli", "xss", "audit".
**Secuencia de Agentes**:
1. `security-auditor` → Diagnostica brechas de seguridad o dependencias vulnerables.
2. `backend-dev` o `devops-engineer` → Aplica parches de seguridad y saneamiento.
3. `qa-engineer` → Valida que las restricciones de seguridad no rompan casos de uso.
4. `security-auditor` → Re-audita para confirmar resolución (Green Audit).
5. `doc-writer` → Documenta políticas de seguridad actualizadas.

---

### Pipeline: `performance-optimization` (Optimización)
**Disparadores**: "lento", "performance", "rendimiento", "memoria", "query", "optimizar", "latencia", "bundle".
**Secuencia de Agentes**:
1. `perf-analyst` → Identifica el cuello de botella (N+1 SQL, re-renders, memory leaks).
2. `db-engineer` o `backend-dev` o `frontend-dev` → Implementa la optimización (índices, caché Redis, memoización).
3. `qa-engineer` → Confirma que el comportamiento lógico sigue intacto.
4. `perf-analyst` → Mide y compara antes/después.
5. `doc-writer` → Documenta hallazgos y mejoras en `docs/performance.md`.

---

## 2. Protocolo de Auto-Reparación (Self-Healing Loop)

Si durante cualquier etapa de desarrollo los comandos de verificación (`npm run lint`, `npm test`, `npx playwright test`) devuelven un código de salida no cero (error):

```
Error detectado por QA / Test Script
           │
           ▼
[Orquestador analiza stack trace]
           │
           ▼
¿El error es de Backend/DB o Frontend?
 ├── Backend/DB  ──> Asignar a `backend-dev` / `db-engineer` con el log de error
 └── Frontend    ──> Asignar a `frontend-dev` con el log de error
           │
           ▼
Re-ejecutar Verificación (Máximo 3 reintentos)
```

Si tras 3 reintentos el test no pasa, se suspende la ejecución y se requiere intervención del Arquitecto.

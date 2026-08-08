# Diagnóstico — Módulo de Facturación (LogisticsPro ERP)

**Fecha:** 2026-08-08 · **Rama:** `master` · **Estado:** diagnóstico previo a implementación (ningún código fue modificado para producir este documento)

Este documento es el entregable solicitado antes de tocar código: estado actual, problemas, huecos, investigación normativa, arquitectura propuesta, modelo de datos, motor fiscal, integración ARCA, jurisdicciones, plan por etapas y riesgos. No se implementó nada todavía.

---

## A. Estado actual

### Modelo de datos (`backend/prisma/schema.prisma`, 1205 líneas)

No existe modelo `Company`/`Tenant`/`Organization`. El sistema es **arquitectónicamente single-tenant**: una sola empresa transportista, múltiples clientes. El único rastro de "tenant" es un string `tenantId` hardcodeado a `"default"`, y solo aparece en el subsistema de fondos de reserva de vehículos (`ReserveFundConfig/ReserveFund/ReserveFundTransaction`) — no en `Client`, `Invoice`, `Certification`, `Contract` ni `Trip`.

Los datos fiscales de la empresa emisora (razón social, CUIT, punto de venta, domicilio fiscal, condición IVA propia) **no están modelados**: existen únicamente como un JSON suelto dentro de `SystemConfig` (`key: 'empresa'`), sembrado una vez en `master-seed.ts:727-734` con datos ficticios (`Transportes del Sur Patagónico S.A.`). **Ningún controller/service backend ni página del frontend lee ese registro** — es dato muerto.

`Client` (líneas 166-198) tiene: `cuit` (unique), `condicionIVA` (string libre, default `RESPONSABLE_INSCRIPTO`, sin enum ni validación contra valores AFIP), `razonSocial`, `domicilio/ciudad/provincia/codigoPostal`, y campos de riesgo crediticio (`limiteCredito`, `diasCredito`, `saldoActual`, `bloqueadoPorRiesgo`, `scoring`).

`Invoice` (814-845): `numero` (único), `tipo: InvoiceType` (`FACTURA_A/B/C, REMITO, NOTA_CREDITO, NOTA_DEBITO`), `status: InvoiceStatus` (`BORRADOR/EMITIDA/PAGADA/VENCIDA/ANULADA`), `subtotal/iva/total` (montos únicos, sin desglose neto gravado/no gravado/exento/percepciones), y tres campos placeholder de AFIP nunca usados: `afipCAE`, `afipCAEVencimiento`, `afipPDFUrl`. Sin `puntoVenta`, sin moneda, sin snapshot de condición fiscal al momento de facturar.

`InvoiceItem` (847-860): `descripcion` (texto libre), `cantidad`, `precioUnit`, `subtotal` — **sin referencia a catálogo de productos/servicios** (no existe ese modelo) y sin IVA por línea (el IVA se calcula una sola vez a nivel de cabecera de factura).

No existe modelo `Payment`, `Product/Service`, `PriceList`, ni ningún enum/modelo de condición fiscal o de jurisdicción.

### Flujo actual: Trip → Certification → Invoice

1. En el frontend (`TripModal.tsx:89-121`), la tarifa de un viaje se calcula 100% del lado cliente: `tarifaAcordada = tarifaBase (del contrato) + montoExcedente (peso excedente × tarifa/tn)`.
2. `Certification` agrupa viajes de un cliente y suma `tarifaAcordada` en `montoTotal` (`certifications.service.ts:37-50`, con un comentario explícito advirtiendo no volver a sumar `montoExcedente` — bug ya corregido tres veces en este proyecto, ver memoria previa).
3. `billing.service.ts` genera la factura desde un trip individual o desde una certificación, en ambos casos como **una sola línea de factura** con el monto total agregado — no hay desglose de flete base vs. excedente vs. impuestos en la factura final.

### Backend de facturación (`backend/src/modules/billing/`)

- **IVA hardcodeado al 21%** en dos lugares: `billing.service.ts:59` y `:117` (`iva = tipo === 'FACTURA_A' ? subtotal * 0.21 : 0`), duplicado también en el frontend (`billing/page.tsx:607`). La `condicionIVA` real del cliente **nunca se consulta** para decidir esto.
- **Numeración de factura aleatoria**: `generateInvoiceNumber()` (`billing.service.ts:9-13`) usa `Math.floor(Math.random() * 90000) + 10000` — no es secuencial, y el punto de venta está hardcodeado como literal `'0001'`. No hay forma de que esto sea válido fiscalmente.
- El mapeo tipo→prefijo (línea 10) es una cadena de ternarios ad hoc: `FACTURA_C` no está contemplada explícitamente y cae en el mismo prefijo `'N'` que las notas de crédito/débito — bug.
- `POST /billing/invoices` recibe `@Body() body: any` — **sin DTO, sin validación alguna**.
- `GET /billing/invoices/overdue` tiene efecto secundario de escritura (marca facturas vencidas) dentro de un método GET, y **no hay ningún cron job** que lo dispare — solo corre cuando alguien abre esa vista.
- `Client.saldoActual` existe en el schema pero se escribe una sola vez en el seed y **nunca se actualiza** — es un campo muerto que induciría a error si alguien confía en él como saldo real.

### Integración AFIP/ARCA

**No existe ninguna integración real.** Búsqueda exhaustiva en todo el repo (backend, frontend, env vars, dependencias, certificados): los tres campos `afipCAE*` en el schema nunca se escriben ni leen desde ningún código. No hay librería de WSAA/WSFE, no hay variables de entorno relacionadas, no hay certificados. Todo el texto "AFIP" que aparece en la UI (`"Factura AFIP emitida"`, `"Facturas AFIP & Cobranzas"`, copy de marketing en el login) es **cosmético**, desconectado de cualquier capacidad real. Esto es importante: hoy el sistema **no emite comprobantes fiscalmente válidos** — son registros internos con numeración aleatoria.

### Permisos

Los endpoints de escritura de facturación (`create`, `updateStatus`, `createFromTrip`) están correctamente restringidos a `SUPER_ADMIN/ADMIN/ACCOUNTANT/OPERATIONS_MANAGER`. Pero:
- **Lectura de facturación** (`findAll`, `getStats`, `getOverdue`, `findOne`) no tiene `@Roles` — cualquier usuario autenticado, incluido `DRIVER`, puede listar todas las facturas con CUIT y montos de clientes.
- **Todo el módulo de certificaciones** (`certifications.controller.ts`) — que es el paso previo directo a facturar — no tiene ningún `@Roles` en ningún endpoint: cualquier usuario autenticado puede crear, aprobar (cambiar a `APROBADO`, lo que habilita el botón "Facturar") o **eliminar** certificaciones.
- Reportes y dashboard financiero: mismo problema, sin restricción de rol.

### Lo demás (relevante para el alcance completo)

No hay catálogo de productos/servicios. No hay modelo `Payment` ni cuenta corriente persistida (solo un cálculo en vivo no persistido en `getSummary360`). No hay reporte de IVA, ventas por período, ni AR-aging — el único "resumen ejecutivo financiero" se calcula desde `Trip.tarifaAcordada`, no desde las facturas reales, por lo que no refleja el estado real de cobranza.

---

## B. Problemas (resumen priorizado)

1. IVA fijo al 21% sin mirar la condición fiscal del cliente ni el tipo de operación — inválido para monotributistas, exentos, exportación, o ítems con alícuota reducida.
2. Numeración de comprobante no secuencial (aleatoria) — invalida cualquier intento de compliance fiscal real.
3. Cero integración ARCA — el sistema no puede emitir comprobantes fiscalmente válidos hoy, pese a que la UI lo sugiere activamente (riesgo de que un usuario crea que está facturando legalmente cuando no es así).
4. Sin modelo de empresa/tenant — no hay dónde guardar CUIT, punto de venta, condición IVA propia, certificados, de forma estructurada.
5. Sin catálogo de productos/servicios — las líneas de factura son texto libre desde un monto agregado.
6. Sin motor fiscal centralizado — la lógica de IVA está duplicada en backend y frontend, y no hay lugar único para agregar IIBB, percepciones, retenciones.
7. Sin modelo de jurisdicciones ni vigencia temporal de alícuotas — imposible modelar Ingresos Brutos correctamente sin esto.
8. Sin `Payment`/cuenta corriente real — `saldoActual` es dato muerto, el estado de cobranza depende de un cambio manual de status.
9. Certificaciones (precursor directo de facturación) sin ninguna restricción de rol — hueco de seguridad relevante antes de agregar más lógica financiera encima.
10. Sin reportes fiscales (libro IVA ventas, IIBB por jurisdicción, etc.).

---

## C. Funcionalidades faltantes

- Motor fiscal (`Fiscal Engine`) desacoplado de la UI.
- Modelo `Company` (empresa emisora, multi-tenant real si se desea a futuro).
- Modelo de jurisdicciones fiscales con vigencia temporal (`TaxJurisdiction`/`TaxRule`).
- Catálogo de productos/servicios con tratamiento fiscal por ítem.
- Ampliación de ficha fiscal de cliente (condición IIBB, jurisdicción, Convenio Multilateral, exenciones).
- Numeración de comprobante secuencial real, por punto de venta.
- Integración ARCA (WSAA + WSFEv1 como mínimo) — ver sección H.
- Modelo `Payment` y cuenta corriente persistida con historial.
- Reportes fiscales (IVA ventas, IIBB por jurisdicción, ventas por cliente/provincia/actividad).
- Panel de administración de reglas fiscales con auditoría de cambios.
- Reforzar permisos en certificaciones y lectura de facturación.

---

## D. Investigación fiscal — fuentes utilizadas

Investigación realizada contra fuentes oficiales y de referencia especializada (agosto 2026). Resumen de lo confirmado, con las fuentes correspondientes:

- **AFIP fue disuelta el 24/10/2024 y reemplazada por ARCA** (Agencia de Recaudación y Control Aduanero) — el código y la UI actuales todavía dicen "AFIP" en todos lados; conviene actualizar terminología a "ARCA" al implementar. [Wikipedia — AFIP](https://en.wikipedia.org/wiki/Administraci%C3%B3n_Federal_de_Ingresos_P%C3%BAblicos)
- **Tipos de comprobante**: Factura A (RI→RI/Monotributo, IVA discriminado), Factura B (RI→Consumidor Final/exento/monotributo, IVA no discriminado), Factura C (emitida siempre por monotributistas), Factura E (exportación). RG ARCA 5824/26 actualiza el régimen de comprobantes electrónicos e incorpora liquidación electrónica mensual, vigente desde el 1/7/2026 — hay que verificar si esta resolución afecta el proyecto al momento de implementar. [Wynges — RG 5824/26](https://wynges.com/blog/rg-5824-26-arca-facturacion-electronica-2026/) · [Commercy — guía ARCA 2026](https://commercy.com.ar/blog/facturacion-electronica-arca-pymes)
- **Webservices de facturación electrónica**: WSFEv1 emite comprobantes A/B/C/M sin detalle de ítem (con CAE); WSFEX para exportación; se requiere certificado digital + autenticación WSAA incluso en homologación. Documentación técnica oficial en el propio sitio de ARCA. [ARCA — documentación WS factura electrónica](https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp) · [Manual desarrollador WSFEv1](https://www.afip.gob.ar/fe/documentos/manual-desarrollador-ARCA-COMPG-v4-0.pdf)
- **Condición frente al IVA**: Responsable Inscripto (liquida débito/crédito fiscal, sin límites de facturación), Monotributista (no genera débito fiscal, cuota sustituye IVA), Exento, Consumidor Final — la condición de ambas partes determina letra de comprobante y discriminación de IVA. [ARCA — sujetos exentos](https://www.afip.gob.ar/iva/informacion-basica/sujetos-exceptuados.asp)
- **Factura de Crédito Electrónica MiPyMEs (FCE)**: régimen regulado por Com. BCRA "A" 7219, orientado a financiamiento de PyMEs vía cobro anticipado de facturas; requiere Domicilio Fiscal Electrónico constituido y vencimiento superior a 30 días. Aplica si la empresa vende a grandes empresas y quiere/debe emitir FCE. [ARCA — Factura de Crédito Electrónica](https://servicioscf.afip.gob.ar/facturadecreditoelectronica/ayuda/manuales.asp)
- **Convenio Multilateral / Ingresos Brutos**: coordinado por la Comisión Arbitral (COMARB, vigente desde 1977). Régimen general de distribución de base imponible: 50% en proporción a gastos efectivamente soportados en cada jurisdicción, 50% en proporción a ingresos de cada jurisdicción (Art. 2). Existe un régimen especial para transporte (Art. 9 CM) con atribución distinta a la general — **no pude confirmar con una fuente primaria unívoca la alícuota o mecánica exacta actual para transporte de cargas**; esto debe confirmarse con la normativa vigente al momento de implementar, no asumirse. [Argentina.gob.ar — COMARB](https://www.argentina.gob.ar/economia/politicatributaria/armonizacion/comarb) · [Comisión Arbitral](https://www.ca.gob.ar/convenio-multilateral)
- **SIRCREB/SIRTAC/SIRCUPA**: sistemas unificados administrados por la Comisión Arbitral para percepción de IIBB sobre acreditaciones bancarias y otros regímenes generales armonizados entre jurisdicciones adheridas. [Argentina.gob.ar — COMARB](https://www.argentina.gob.ar/economia/politicatributaria/armonizacion/comarb)
- **Salta (jurisdicción de referencia del cliente)**: IIBB se llama "Impuesto a las Actividades Económicas", administrado por DGR Salta, con régimen general (alícuotas 0,5%-9% según actividad), régimen simplificado, o Convenio Multilateral según corresponda. Encontré una mención de alícuota especial del 2% para transporte de cargas/pasajeros bajo régimen especial de Convenio Multilateral, pero **la fuente no es lo suficientemente primaria como para tomarla como dato de configuración sin verificarla contra la Resolución General DGR Salta vigente** — se deja documentado como pendiente de confirmación contable, tal como pediste, en vez de cargarla como válida. [YoFacturo — DGR Salta](https://yo-facturo.com/blog/dgr-salta-ingresos-brutos/) · [Nomenclador Tucumán, como referencia de formato de nomenclador](https://www.rentastucuman.gob.ar/nomina/rentastuc2/nwx1ut2pa3lo/nomencladordgr.pdf)
- **Retenciones de IVA — RG 2854**: régimen general donde actúan como agentes de retención ciertos sujetos designados por ARCA (incluye Administración Pública y sujetos en nómina del Anexo I); no corresponde retener si el importe a retener es ≤ $400. Esta RG es de terceros que le retienen a la empresa, no de la empresa reteniendo a sus clientes — relevante para el crédito fiscal de la empresa, no para la emisión de sus facturas. [ARCA — Rég. General de Retención IVA RG 2854](https://servicioscf.afip.gob.ar/publico/abc/ABCpaso2.aspx?id_nivel1=3269&id_nivel2=3289&p=R%C3%A9g.+General+de+Retenci%C3%B3n+de+IVA+-+RG+2854)
- **Alícuota de IVA sobre transporte de cargas**: confirmé que el 10,5% reducido aplica a transporte de pasajeros (>100km), no encontré una fuente oficial primaria que confirme una alícuota reducida específica para transporte de cargas/fletes — la presunción de mercado es que tributa al 21% general, pero **esto debe confirmarse explícitamente con un contador antes de cargarlo en el motor fiscal**, no asumirse de una búsqueda web. [Servidos — calculadora IVA (referencial, no oficial)](https://servidos.ar/calculadora-iva)

**Conclusión de la investigación**: el marco general (tipos de comprobante, condiciones IVA, mecánica de WSFEv1, existencia y objetivo de Convenio Multilateral/SIRCREB, FCE) está bien confirmado contra fuentes con peso oficial. Las **alícuotas concretas y vigentes** (IIBB por provincia y actividad, si transporte de cargas tiene tratamiento especial de IVA, la mecánica exacta del Art. 9 CM para transporte) **no las voy a cargar como datos fijos** sin una fuente primaria verificada o confirmación de tu contador — en su lugar, la arquitectura (secciones E-I) deja esos valores como configuración administrable con vigencia temporal, vacía hasta que se cargue con datos confirmados.

---

## E. Arquitectura propuesta

Principio rector: **separar completamente el motor fiscal de la UI/componentes React**, y que las reglas fiscales sean **datos configurables con vigencia temporal**, no lógica hardcodeada.

```
┌─────────────────────┐      ┌──────────────────────┐      ┌────────────────────┐
│  Frontend (billing)  │ ───▶ │  BillingService        │ ───▶ │  FiscalEngineService │
│  crea factura/nota   │      │  (orquesta creación,   │      │  (calculateTaxes,    │
│                      │      │   numeración, persist.)│      │   determineVoucher)  │
└─────────────────────┘      └──────────────────────┘      └──────────┬─────────┘
                                                                        │ lee
                                                             ┌──────────▼─────────┐
                                                             │ TaxJurisdiction,     │
                                                             │ TaxRule, TaxRate,    │
                                                             │ Company, Product     │
                                                             │ (con validFrom/To)   │
                                                             └────────────────────┘
```

Nuevos módulos backend:
- `backend/src/modules/fiscal/` — `FiscalEngineService` (motor puro, sin dependencias de HTTP), `fiscal-jurisdictions.controller.ts` (admin CRUD de jurisdicciones/reglas), DTOs de configuración.
- `backend/src/modules/company/` — configuración fiscal de la empresa emisora (reemplaza el JSON muerto en `SystemConfig`).
- `backend/src/modules/products/` — catálogo de productos/servicios facturables.
- `backend/src/modules/payments/` — registro de cobros y cuenta corriente real.
- `backend/src/modules/arca/` (o `afip/`) — integración WSAA/WSFEv1, aislada detrás de una interfaz para poder mockear en tests y en homologación.

`billing.service.ts` deja de calcular IVA él mismo: llama a `fiscalEngine.calculateTaxes({ company, customer, items, transactionDate, jurisdiction, operationType })` y persiste el resultado.

---

## F. Modelo de datos — tablas nuevas/modificadas

**Nuevas:**
- `Company` — razón social, CUIT, condición IVA propia, domicilio fiscal, jurisdicción sede, Convenio Multilateral (bool + jurisdicciones), puntos de venta (`CompanySalesPoint[]`), certificados ARCA (referencia a almacenamiento seguro, no el certificado en sí en la DB).
- `CompanySalesPoint` — punto de venta ARCA habilitado, numeración por tipo de comprobante.
- `TaxJurisdiction` — provincia/CABA, código, organismo (ej. DGR Salta), fuente normativa.
- `TaxRule` — jurisdicción, tipo de impuesto (IVA/IIBB/percepción/retención), actividad, alícuota, exención, `validFrom`, `validTo`, fuente normativa, estado. Es la tabla que reemplaza cualquier alícuota hardcodeada.
- `Product` / `Service` — código, descripción, unidad, precio, tipo de IVA por defecto, actividad relacionada.
- `Payment` — cliente, factura(s) que salda (parcial o total), fecha, medio de pago, monto, usuario.
- `ClientFiscalProfile` (o ampliar `Client` directamente) — condición IIBB, jurisdicción, número de inscripción CM, actividad, exenciones con vigencia.
- `FiscalRuleAuditLog` — quién cambió qué regla fiscal y cuándo (requisito de la sección 19 del pedido).

**Modificadas:**
- `Invoice`: agregar `puntoVenta`, `letra` (o derivarla de `tipo`), `netoGravado/netoNoGravado/exento`, `percepciones Json`/tabla relacionada, `retenciones`, `condicionIVACliente` (snapshot al momento de emitir), `companyId`, `taxRulesApplied Json` (trazabilidad de qué reglas se usaron).
- `InvoiceItem`: agregar `productId?`, `tasaIVA`, `montoIVA` por línea.
- `Client`: mover condición fiscal a enum validado o a `ClientFiscalProfile`.

No se elimina nada existente — `Trip.tarifaAcordada`, `Certification`, etc. siguen siendo la fuente de los montos; el motor fiscal se inserta **después** de ese cálculo, no lo reemplaza.

---

## G. Motor fiscal — diseño funcional

```ts
calculateTaxes({
  company,        // Company + su config fiscal
  customer,        // Client + ClientFiscalProfile
  items,           // líneas con producto/servicio, cantidad, precio
  transactionDate, // fecha de la operación (no "hoy")
  jurisdiction,    // jurisdicción de la operación (puede diferir de la sede)
  operationType,   // venta normal, nota de crédito/débito, exportación...
}): {
  comprobante: { tipo, letra },
  neto: number,
  netoNoGravado: number,
  exento: number,
  ivaDiscriminado: { alicuota, base, monto }[],
  percepciones: { concepto, jurisdiccion, monto }[],
  retenciones: { concepto, monto }[],
  iibb: { jurisdiccion, alicuota, monto }[],
  total: number,
  reglasAplicadas: { taxRuleId, validFrom, validTo, fuente }[],
  advertencias: string[],
}
```

Reglas clave: toda consulta a `TaxRule` filtra por `validFrom <= transactionDate <= (validTo ?? infinito)`; si no hay regla vigente para una combinación jurisdicción+actividad+fecha, el motor **no inventa un valor** — devuelve una advertencia bloqueante y exige carga manual/administrativa antes de emitir.

---

## H. Integración ARCA — qué existe y qué falta

**Existe:** nada funcional (ver sección A). Los tres campos `afip*` en `Invoice` y todo el texto "AFIP" en la UI son placeholders sin lógica detrás.

**Falta, en orden de necesidad:**
1. Certificado digital + clave privada registrados en ARCA para la CUIT de la empresa (trámite que hace el usuario/contador, no algo que se pueda generar desde código).
2. Cliente WSAA (autenticación, obtiene ticket de acceso) y cliente WSFEv1 (`FECAESolicitar` para pedir CAE) — SOAP. Evaluar SDKs existentes de la comunidad (ej. `afip.js` u homólogo) vs. implementación propia sobre `soap`/`node-soap`, sin comprometerse a una librería específica sin evaluarla primero.
3. Ambiente de homologación primero, producción después — nunca probar contra producción real de ARCA con datos reales sin validar en homologación.
4. Manejo de estados de comprobante, reintentos ante caída del webservice, consulta de comprobantes ya autorizados, generación de QR obligatorio en el PDF.
5. Definir explícitamente qué pasa si ARCA está caído al momento de facturar (cola de reintento, no bloquear toda la operación del ERP).

Esto es la pieza de mayor riesgo/esfuerzo externo del proyecto porque depende de un trámite administrativo (alta del certificado) que solo puede hacer el titular de la CUIT — no es bloqueante para avanzar con el resto de la arquitectura (motor fiscal, modelo de datos, UI), pero sí lo es para que una factura emitida por el sistema tenga validez legal real.

---

## I. Provincias — manejo de jurisdicciones

`TaxJurisdiction` cubre las 23 provincias + CABA como filas de datos, no como código hardcodeado — agregar una jurisdicción nueva es una fila, no un deploy. Cada jurisdicción tiene sus propias `TaxRule` de IIBB con vigencia temporal y fuente normativa citada. La empresa puede tener una jurisdicción sede y operar (facturar, tener percepciones) en otras — el motor fiscal (sección G) recibe la jurisdicción de la operación como parámetro explícito, no la asume de la sede de la empresa.

Dato pendiente y explícito: **no cargué ninguna alícuota real de IIBB de ninguna provincia** en este diagnóstico — eso se hace en la etapa de implementación, jurisdicción por jurisdicción, idealmente con la validación de tu contador, empezando por Salta (jurisdicción real de la empresa) y agregando el resto según vayan sumando operaciones ahí.

---

## J. Plan de implementación (etapas incrementales)

Cada etapa es desplegable y no rompe la anterior. No se toca `AUTO_SEED_ON_BOOT` ni la DB de producción sin autorización explícita en cada paso.

1. **Base de datos y modelos** — agregar `Company`, `TaxJurisdiction`, `TaxRule`, `Product`, `Payment`, ampliar `Client`/`Invoice`/`InvoiceItem` (sección F). Solo migraciones aditivas, sin tocar datos existentes.
2. **Motor fiscal (Fiscal Engine)** — `calculateTaxes()` con solo IVA (21%/10,5%/0%/exento) parametrizado por `TaxRule`, sin IIBB todavía. Reemplaza el hardcodeo actual en `billing.service.ts:59/117` y en el frontend.
3. **Numeración real de comprobante** — secuencial por `CompanySalesPoint` + tipo, elimina el `Math.random()`.
4. **Catálogo de productos/servicios** — opcional para el usuario, pero disponible; migrar el flujo trip→invoice para generar líneas desglosadas (flete base + excedente) en vez de un solo monto.
5. **Ficha fiscal de cliente y empresa** — UI para cargar CUIT/condición IVA/jurisdicción real de la empresa (reemplaza el JSON muerto) y ampliar la de clientes.
6. **Ingresos Brutos + jurisdicciones** — cargar Salta primero (con datos confirmados, no inventados), dejar el resto de provincias como estructura vacía lista para completar.
7. **Retenciones/percepciones** — régimen nacional y de IIBB, activable por cliente/jurisdicción.
8. **Cuenta corriente real** — modelo `Payment`, reemplazar el cálculo en vivo de `getSummary360` por saldo persistido y consistente.
9. **Seguridad** — cerrar los huecos de permisos en certificaciones y lectura de facturación (sección A) — esto puede adelantarse a etapa 0 dado que es independiente y de bajo riesgo.
10. **Integración ARCA** — homologación primero, requiere el trámite de certificado del lado del usuario en paralelo.
11. **Reportes fiscales** — libro IVA ventas, IIBB por jurisdicción, ventas por cliente/provincia.
12. **Panel de administración de reglas fiscales** — CRUD de `TaxRule`/`TaxJurisdiction` restringido a `SUPER_ADMIN`, con auditoría.

Sugiero empezar por la **etapa 9 (permisos)** en paralelo por ser independiente, rápida y de alto valor de seguridad, y luego seguir el orden 1→2→3 antes de avanzar a IIBB/ARCA.

---

## K. Riesgos

- **Doble cálculo de IVA durante la transición**: mientras el motor fiscal conviva con el hardcodeo actual, hay riesgo de inconsistencia — la etapa 2 debe eliminar el hardcodeo el mismo día que se activa el motor, no dejarlos en paralelo.
- **Migraciones en producción real**: este proyecto tiene datos reales de clientes (ver memoria del proyecto) — cada migración de la etapa 1 debe revisarse contra el flujo ya establecido (`prisma db push`, backup previo) antes de aplicarse a Railway.
- **Certificaciones/facturas ya emitidas con el esquema viejo**: al agregar `companyId`, `condicionIVACliente`, etc. a `Invoice`, las facturas históricas quedarán con esos campos nulos — hay que decidir explícitamente si se backfillean (con qué criterio) o se dejan nulos y se documenta el corte.
- **Integración ARCA depende de un trámite externo** (alta de certificado) que no controla el desarrollo — puede bloquear la etapa 10 por tiempos administrativos ajenos al código.
- **Alícuotas de IIBB desactualizadas o mal cargadas** tienen impacto fiscal/legal real — la sección D dejó explícitamente sin confirmar varios datos; cargarlos sin verificación de un contador es el riesgo más serio de todo el proyecto.
- **Permisos de certificaciones**: cerrar ese hueco (etapa 9) es en sí mismo un cambio de comportamiento para usuarios `DRIVER`/`VIEWER` que hoy pueden crear/aprobar certificaciones — confirmar con el usuario que ningún flujo real depende de que esos roles tengan ese acceso antes de restringirlo.

---

## Próximo paso

Este documento es el diagnóstico — no implementé nada. Quedo a la espera de que confirmes:
1. Si el orden de etapas propuesto (J) te sirve, o preferís otro.
2. Si arrancamos por la etapa 9 (permisos, independiente y rápida) mientras definimos el resto.
3. Datos fiscales reales de la empresa (CUIT, condición IVA, punto de venta, jurisdicción sede) para poder cargar `Company` con datos reales en vez de placeholders — no los voy a inventar.

# Implementacion de Reservo para otra clinica

## Objetivo

Este documento explica como reutilizar la integracion actual de Reservo de este proyecto para otra clinica.

Incluye:

- Que hace hoy el sistema.
- Que variables `RESERVO_*` usa realmente.
- Como obtener cada ID y cada valor del `.env`.
- Que endpoints internos exponer para ver disponibilidad, agendar y recibir webhooks.
- Que dependencias son obligatorias para webhooks y procesamiento async.
- Que partes del codigo tocar si quieres soportar multiples clinicas.

## Resumen ejecutivo

La implementacion actual es `single-tenant` por deployment.

Eso significa:

- Un deployment = una clinica.
- Una configuracion `.env` = una agenda online principal.
- Un conjunto fijo de `RESERVO_AGENDA_UUID`, `RESERVO_TREATMENT_UUID`, `RESERVO_SUCURSAL_UUID` y `RESERVO_PROFESIONAL_UUID`.

La forma mas simple y segura de aplicar esto a otra clinica es:

1. Duplicar el deployment.
2. Cargar un `.env` nuevo para esa clinica.
3. Crear/validar su webhook propio.
4. Apuntar su frontend a esa API.

Si quieres que un mismo backend soporte varias clinicas, al final de este documento hay una seccion de refactor.

## Punto importante: con solo `RESERVO_TOKEN` no alcanza para agendar

Con solo el token puedes autenticar llamadas a la API, pero para esta integracion necesitas al menos identificar la agenda online que vas a usar.

En la practica, el minimo real es:

- `RESERVO_TOKEN`
- `RESERVO_AGENDA_UUID`

Una vez que tienes `RESERVO_AGENDA_UUID`, el resto de IDs ya los puedes descubrir por API:

- profesionales
- tratamientos
- sucursales
- horarios
- campos del formulario

Sin `RESERVO_AGENDA_UUID`, esta implementacion no sabe que agenda online consultar.

Segun la documentacion de Reservo para agenda online, el `uuid_agenda` se obtiene desde:

- `Configuracion -> Agendas -> Agendas online -> parte final de la URL`

En este proyecto, aunque la variable se llama `RESERVO_AGENDA_UUID`, en la practica representa el `codigo` o `uuid_agenda` de la agenda online publica.

## Mapa de archivos del proyecto

Estas son las piezas clave de la integracion actual:

- `server/lib/reservo-availability.ts`
  - Consulta disponibilidad en Reservo.
  - Usa `agenda_online/{uuid_agenda}/horarios_disponibles/`.
  - Si falta `RESERVO_TREATMENT_UUID`, intenta descubrir el primer tratamiento disponible.

- `server/lib/reservo.ts`
  - Crea la reserva en Reservo.
  - Usa `https://reservo.cl/makereserva/confirmApptAPI/`.

- `server/lib/reservo-webhooks.ts`
  - Crea, valida y consulta webhooks en Reservo.
  - Recupera `public_key`.

- `server/lib/reservo-events.ts`
  - Valida firma del webhook.
  - Encola eventos entrantes.
  - Procesa `pacientes`, `citas`, `ventas` y `ping`.

- `server/index.ts`
  - Expone los endpoints HTTP internos del sistema.

- `server/lib/validation.ts`
  - Define el contrato exacto de `POST /api/bookings`.

- `src/lib/reservo.ts`
  - Cliente frontend para cargar disponibilidad.

- `src/lib/booking-api.ts`
  - Cliente frontend para crear reservas.

- `src/components/booking/QualifiedCalendarStep.tsx`
  - Llama disponibilidad.
  - Filtra horarios segun reglas de UI.
  - Envia la reserva al backend.

- `supabase/schema.sql`
  - Esquema necesario para webhooks, cola, reconciliacion y Reservo Hub.

## Flujo end-to-end actual

### 1. Disponibilidad

El frontend llama:

```http
GET /api/reservo/availability
```

El backend:

1. Lee `RESERVO_AGENDA_UUID`.
2. Consulta `horarios_disponibles` por semanas.
3. Opcionalmente valida los cupos de hoy en tiempo real.
4. Devuelve:

```json
{
  "ok": true,
  "availability": {
    "2026-03-24": ["09:00", "09:20", "09:40"]
  }
}
```

### 2. Reserva

El frontend llama:

```http
POST /api/bookings
Content-Type: application/json
```

El backend:

1. Valida payload.
2. Construye comentario, detalles y metadatos.
3. Hace `POST` a `makereserva/confirmApptAPI/`.
4. Guarda trazas locales/Supabase.
5. Devuelve:

```json
{
  "ok": true,
  "booking_id": "xxxxx",
  "schedule_datetime": "2026-03-24T12:00:00.000Z",
  "doctor": "Nombre doctor",
  "clinic_address": "Direccion",
  "clinic_phone": "+569..."
}
```

### 3. Webhook entrante

Reservo hace `POST` a:

```http
POST /api/webhooks/reservo
```

El backend:

1. Conserva el `rawBody`.
2. Intenta verificar firma ED25519.
3. Guarda el evento en `reservo_webhook_events_raw`.
4. Responde rapido con `200`.

### 4. Worker async

Luego un cron llama:

```http
POST /api/jobs/reservo-process?limit=25
Authorization: Bearer <CRON_SECRET>
```

El worker:

1. Toma eventos pendientes.
2. Procesa `pacientes`, `citas`, `ventas`.
3. Actualiza tablas Reservo.
4. Reintenta con backoff si algo falla.

## Variables de entorno Reservo

### Variables obligatorias para disponibilidad + booking

`RESERVO_TOKEN`

- Obligatoria: si
- Uso: autenticar llamadas a Reservo.
- Como obtenerla: la entrega Reservo para API.
- Nota: nunca debe salir al frontend.

`RESERVO_API_BASE_URL`

- Obligatoria: si
- Valor normal: `https://reservo.cl/APIpublica/v2`
- Uso: endpoints de agenda online y webhooks.

`RESERVO_AGENDA_UUID`

- Obligatoria: si
- Uso: identificar la agenda online a consultar.
- Como obtenerla: desde Reservo, en `Configuracion -> Agendas -> Agendas online`, tomando la parte final de la URL.
- Nota: aunque el nombre dice `UUID`, en esta integracion corresponde al identificador publico de la agenda online.

`RESERVO_BOOKING_URL_CODE`

- Obligatoria: recomendada
- Uso: se manda en el campo `url` al crear la reserva.
- Como obtenerla: normalmente es el mismo valor que `RESERVO_AGENDA_UUID`.
- Nota: en este proyecto, si no la defines, cae a `RESERVO_AGENDA_UUID`.

`RESERVO_TREATMENT_UUID`

- Obligatoria: recomendada
- Uso: filtrar disponibilidad y crear la reserva.
- Como obtenerla: desde `GET /agenda_online/{uuid_agenda}/tratamientos/`.
- Nota: el backend puede descubrir el primer tratamiento si no la defines, pero para produccion conviene dejarla fija.

`RESERVO_SUCURSAL_UUID`

- Obligatoria: si para booking
- Uso: se manda como `sucursal` al crear la reserva.
- Como obtenerla: desde `GET /agenda_online/{uuid_agenda}/sucursales/`.
- Nota: en algunas respuestas viene como `sucursal`; en otras, como `uuid`. Es el mismo identificador.

`RESERVO_PROFESIONAL_UUID`

- Obligatoria: si para booking
- Uso: se manda dentro de `agendas_uuid`.
- Como obtenerla: desde `GET /agenda_online/{uuid_agenda}/profesionales/`.
- Nota importante: usa el valor del campo `agenda` del endpoint de profesionales. En la clinica actual `agenda` y `uuid` coinciden, pero conceptualmente este valor es la agenda/profesional agendable.

`RESERVO_BOOKING_ENDPOINT`

- Obligatoria: no
- Valor normal: `https://reservo.cl/makereserva/confirmApptAPI/`
- Uso: endpoint final para confirmar la reserva.

### Variables opcionales de disponibilidad

`RESERVO_WEEKS_AHEAD`

- Obligatoria: no
- Default: `6`
- Uso: cuantas semanas hacia adelante consultar en disponibilidad.

`RESERVO_REALTIME_SLOT_VALIDATION`

- Obligatoria: no
- Default: `1`
- Uso: para los horarios del dia actual hace una validacion extra en tiempo real con un cliente de prueba.
- Nota: ayuda a sacar cupos que ya no estan realmente disponibles.

### Variables obligatorias para webhooks

`RESERVO_WEBHOOK_UUID`

- Obligatoria: si quieres validar firma o consultar el webhook ya creado.
- Como obtenerla: al crear el webhook, Reservo devuelve este UUID.

`RESERVO_WEBHOOK_PUBLIC_KEY`

- Obligatoria: no, pero recomendada
- Uso: validar firma de webhooks.
- Como obtenerla: desde el endpoint de retrieve de webhooks o desde el admin endpoint del proyecto.
- Nota: si no esta, el backend intenta obtenerla usando `RESERVO_WEBHOOK_UUID`.

`RESERVO_WEBHOOK_CONTACT_EMAIL`

- Obligatoria: recomendada
- Uso: email al que Reservo avisara si el webhook falla.

`RESERVO_PUBLIC_KEY_CACHE_TTL_MIN`

- Obligatoria: no
- Default: `60`
- Uso: cache de la llave publica del webhook.

`RESERVO_WEBHOOKS_CREATE_PATH`

- Obligatoria: no
- Default: `/webhooks/`

`RESERVO_WEBHOOKS_VALIDATE_CREATE_PATH`

- Obligatoria: no
- Default: `/webhooks_validar_create`

`RESERVO_WEBHOOKS_RETRIEVE_PATH`

- Obligatoria: no
- Default: `/webhooks/`

### Variables opcionales del Reservo Hub

`RESERVO_EVALUATION_MAX_CLP`

- Obligatoria: no
- Default: `50000`
- Uso: separar evaluaciones de procedimientos/cirugias al analizar ventas.

### Variables Reservo que existen en este repo pero no son criticas para el flujo principal

`RESERVO_BASE_URL`

- Uso: base legacy para algunas llamadas auxiliares.
- Nota: si no esta, varias utilidades caen a `RESERVO_API_BASE_URL`.

`RESERVO_BOOKINGS_LIST_PATH`

- Default: `/bookings`
- Uso: listados auxiliares de reservas.
- Nota: no participa en disponibilidad ni en `confirmApptAPI`.

`RESERVO_BOOKINGS_GET_PATH_TEMPLATE`

- Default: `/bookings/{booking_id}`
- Uso: consulta auxiliar por ID.
- Nota: no participa en disponibilidad ni en `confirmApptAPI`.

## Variables de entorno no-Reservo pero necesarias para el sistema completo

`SUPABASE_URL`

- Obligatoria: si quieres webhooks, cola, Reservo Hub y persistencia robusta.

`SUPABASE_SERVICE_ROLE_KEY`

- Obligatoria: si quieres webhooks, cola, Reservo Hub y persistencia robusta.

`CRON_SECRET`

- Obligatoria: si vas a usar `/api/jobs/reservo-process`.

`METRICS_USER`

- Obligatoria: recomendada para proteger endpoints admin.

`METRICS_PASS`

- Obligatoria: recomendada para proteger endpoints admin.

`APP_BASE_URL`

- Obligatoria: recomendada para crear webhooks automaticamente apuntando al dominio correcto.

`API_SIGNING_SECRET`

- Obligatoria: recomendada para otros endpoints internos firmados del proyecto.

## Como obtener cada ID desde Reservo

### 1. Obtener `RESERVO_AGENDA_UUID`

Este es el primer dato que debes conseguir.

Reservo documenta que el `uuid_agenda` se obtiene desde la configuracion de agendas online, usando la parte final de la URL de esa agenda.

En esta base de codigo, ese valor llena:

- `RESERVO_AGENDA_UUID`
- `RESERVO_BOOKING_URL_CODE` (normalmente el mismo)

Si no tienes acceso a la URL/configuracion de la agenda online de la otra clinica, el token por si solo no te permite usar esta integracion tal como esta implementada hoy.

### 2. Obtener `RESERVO_PROFESIONAL_UUID`

Con `RESERVO_TOKEN` y `RESERVO_AGENDA_UUID` ya puedes pedir los profesionales/agendas:

```bash
curl -H "Authorization: Token $RESERVO_TOKEN" \
  "https://reservo.cl/APIpublica/v2/agenda_online/$RESERVO_AGENDA_UUID/profesionales/"
```

Respuesta esperada:

```json
{
  "resultados": [
    {
      "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "agenda": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "nombre": "Dr. Ejemplo",
      "sucursal": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

Usa:

- `resultados[i].agenda` como `RESERVO_PROFESIONAL_UUID`

### 3. Obtener `RESERVO_TREATMENT_UUID`

```bash
curl -H "Authorization: Token $RESERVO_TOKEN" \
  "https://reservo.cl/APIpublica/v2/agenda_online/$RESERVO_AGENDA_UUID/tratamientos/?pagina=1"
```

Respuesta esperada:

```json
{
  "resultados": [
    {
      "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "nombre": "Evaluacion",
      "duracion": "00:20:00",
      "valor": "20000.00"
    }
  ]
}
```

Usa:

- `resultados[i].uuid` como `RESERVO_TREATMENT_UUID`

### 4. Obtener `RESERVO_SUCURSAL_UUID`

```bash
curl -H "Authorization: Token $RESERVO_TOKEN" \
  "https://reservo.cl/APIpublica/v2/agenda_online/$RESERVO_AGENDA_UUID/sucursales/"
```

Respuesta esperada:

```json
{
  "resultados": [
    {
      "sucursal": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "nombre": "Clinica Ejemplo",
      "direccion": "Direccion",
      "time_zone": "America/Santiago"
    }
  ]
}
```

Usa:

- `resultados[i].sucursal` como `RESERVO_SUCURSAL_UUID`

### 5. Obtener horarios disponibles

```bash
curl -H "Authorization: Token $RESERVO_TOKEN" \
  "https://reservo.cl/APIpublica/v2/agenda_online/$RESERVO_AGENDA_UUID/horarios_disponibles/?uuid_tratamiento=$RESERVO_TREATMENT_UUID&fecha=2026-03-24&uuid_sucursal=$RESERVO_SUCURSAL_UUID&uuid_profesional=$RESERVO_PROFESIONAL_UUID"
```

Respuesta esperada:

```json
[
  {
    "fecha": "2026-03-24",
    "sucursales": [
      {
        "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "profesionales": [
          {
            "agenda": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "nombre": "Dr. Ejemplo",
            "horas_disponibles": [
              "2026-03-24T09:00:00-03:00",
              "2026-03-24T09:20:00-03:00"
            ]
          }
        ]
      }
    ]
  }
]
```

Este endpoint es la base del endpoint interno `GET /api/reservo/availability`.

### 6. Obtener los campos del formulario de cliente

```bash
curl -H "Authorization: Token $RESERVO_TOKEN" \
  "https://reservo.cl/APIpublica/v2/agenda_online/$RESERVO_AGENDA_UUID/form/"
```

Respuesta esperada:

```json
[
  { "nombre": "rut", "required": true, "type": "rut" },
  { "nombre": "nombre", "required": true, "type": "text" },
  { "nombre": "apellido_paterno", "required": true, "type": "text" },
  { "nombre": "apellido_materno", "required": true, "type": "text" },
  { "nombre": "email", "required": true, "type": "email" },
  { "nombre": "telefono", "required": true, "type": "tel" }
]
```

Esto es util para confirmar que el payload de cliente que estas enviando sigue siendo valido para la otra clinica.

## `.env` minimo recomendado para una nueva clinica

```env
RESERVO_TOKEN=tu_token
RESERVO_API_BASE_URL=https://reservo.cl/APIpublica/v2
RESERVO_AGENDA_UUID=tu_codigo_agenda_online
RESERVO_BOOKING_URL_CODE=tu_codigo_agenda_online
RESERVO_TREATMENT_UUID=uuid_tratamiento
RESERVO_SUCURSAL_UUID=uuid_sucursal
RESERVO_PROFESIONAL_UUID=uuid_agenda_profesional
RESERVO_BOOKING_ENDPOINT=https://reservo.cl/makereserva/confirmApptAPI/
RESERVO_WEEKS_AHEAD=6
RESERVO_REALTIME_SLOT_VALIDATION=1

APP_BASE_URL=https://tu-dominio
CRON_SECRET=un_secreto_largo
METRICS_USER=admin
METRICS_PASS=otro_secreto_largo
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

Despues de crear el webhook, agrega tambien:

```env
RESERVO_WEBHOOK_UUID=uuid_devuelto_por_reservo
RESERVO_WEBHOOK_PUBLIC_KEY=public_key_devuelta_por_reservo
RESERVO_WEBHOOK_CONTACT_EMAIL=ops@tu-clinica.cl
```

## Endpoints internos del sistema actual

### `GET /api/reservo/availability`

Uso:

- El frontend lo consume para pintar el calendario.

Implementacion:

- `server/index.ts`
- `server/lib/reservo-availability.ts`

Respuesta:

```json
{
  "ok": true,
  "availability": {
    "YYYY-MM-DD": ["HH:MM", "HH:MM"]
  }
}
```

Notas:

- El backend consulta varias semanas (`RESERVO_WEEKS_AHEAD`).
- Para el dia actual puede hacer validacion extra en vivo con `confirmApptAPI`.

### `POST /api/bookings`

Uso:

- Crear una reserva real en Reservo.

Payload requerido:

```json
{
  "personal": {
    "rut": "12.345.678-5",
    "first_name": "Ana",
    "last_name_1": "Perez",
    "last_name_2": "Lopez",
    "phone": "+56912345678",
    "email": "ana@correo.cl"
  },
  "qualification": {
    "age": 32,
    "height_m": 1.62,
    "weight_kg": 68,
    "imc": 25.9,
    "qualified": true
  },
  "attribution": {
    "session_id": "uuid",
    "landing_url": "https://tu-sitio/landing",
    "referrer": "https://google.com"
  },
  "selected_slot": {
    "date": "2026-03-24",
    "time": "12:00",
    "datetime_iso": "2026-03-24T15:00:00.000Z"
  },
  "lead_event_id": "uuid-opcional",
  "schedule_event_id": "uuid-opcional",
  "complete_registration_event_id": "uuid-opcional",
  "event_source_url": "https://tu-sitio/landing"
}
```

Notas importantes:

- `qualification` es obligatoria para este sistema, aunque Reservo no la necesita estrictamente.
- `event_source_url` es obligatorio en este backend.
- La reserva se crea usando `RESERVO_SUCURSAL_UUID`, `RESERVO_TREATMENT_UUID`, `RESERVO_PROFESIONAL_UUID` y `RESERVO_BOOKING_URL_CODE`.

Respuesta exitosa:

```json
{
  "ok": true,
  "booking_id": "id_reserva",
  "schedule_datetime": "2026-03-24T15:00:00.000Z",
  "doctor": "Dr. Ejemplo",
  "clinic_address": "Direccion",
  "clinic_phone": "+569..."
}
```

### `POST /api/webhooks/reservo`

Uso:

- Recibir eventos de Reservo.

Implementacion:

- `server/index.ts`
- `server/lib/reservo-events.ts`
- `server/lib/reservo-signature.ts`

Payload esperado de Reservo:

```json
{
  "fuente": "uuid-del-webhook",
  "evento": "citas",
  "uuid_evento": "uuid-del-evento",
  "datos": {},
  "procesado_a_las": "2026-03-24T12:00:00.000Z"
}
```

Eventos soportados por el worker:

- `ping`
- `pacientes`
- `citas`
- `ventas`

### `POST /api/jobs/reservo-process`

Uso:

- Procesar la cola de webhooks guardada en Supabase.

Proteccion:

- `Authorization: Bearer <CRON_SECRET>`
- o `x-cron-secret: <CRON_SECRET>`

Parametro:

- `limit`, default `25`

Respuesta:

```json
{
  "ok": true,
  "selected": 10,
  "processed": 10,
  "retried": 0,
  "failed": 0,
  "queue": {
    "pending": 0,
    "failed": 0,
    "events_last_hour": 15,
    "events_per_minute": 0.25
  }
}
```

### Endpoints admin utiles para la puesta en marcha

Todos estan protegidos con Basic Auth usando `METRICS_USER` y `METRICS_PASS`.

`POST /api/admin/reservo-webhook/create`

- Crea el webhook en Reservo.

Body:

```json
{
  "email_contacto": "ops@tu-clinica.cl",
  "descripcion": "Webhook Clinica X",
  "url": "https://tu-dominio/api/webhooks/reservo",
  "suscripciones": ["citas", "pacientes", "ventas"]
}
```

`POST /api/admin/reservo-webhook/validate`

- Solicita validacion/health-check del webhook recien creado.

Body:

```json
{
  "uuid": "webhook_uuid"
}
```

`GET /api/admin/reservo-webhook/public-key?uuid=...`

- Recupera la `public_key`.

`GET /api/admin/reservo/debug-events`

- Ver eventos crudos.

`POST /api/admin/reservo/reprocess`

- Reintentar un `uuid_evento`.

`GET /api/admin/reservo/status-map`

- Ver mapeo de estados de citas.

## Como se construye la reserva en este proyecto

El backend envia a Reservo un `POST` a:

```http
https://reservo.cl/makereserva/confirmApptAPI/
```

Con un body equivalente a:

```json
{
  "sucursal": "{{RESERVO_SUCURSAL_UUID}}",
  "tratamientos_uuid": ["{{RESERVO_TREATMENT_UUID}}"],
  "agendas_uuid": ["{{RESERVO_PROFESIONAL_UUID}}"],
  "url": "{{RESERVO_BOOKING_URL_CODE}}",
  "calendario": {
    "date": "YYYY-MM-DD",
    "hour": "HH:MM",
    "time_zone": "America/Santiago"
  },
  "procedimiento": "Nombre procedimiento",
  "comentario": "Nombre procedimiento",
  "comentarios": "detalle extendido",
  "observaciones": "detalle extendido",
  "nota": "detalle extendido",
  "cliente": {
    "rut": "12.345.678-5",
    "nombre": "Ana",
    "apellido_paterno": "Perez",
    "apellido_materno": "Lopez",
    "telefono": "+56912345678",
    "email": "ana@correo.cl"
  },
  "metadatos": {
    "attribution": {},
    "qualification": {},
    "lead_event_id": "uuid"
  }
}
```

Notas:

- Este proyecto no requiere `uuid_cliente` previo.
- Usa los campos del formulario del cliente directamente.
- `telefono` se normaliza a formato internacional.
- El procedimiento/comentarios se enriquecen con datos del lead.

## Como implementar la disponibilidad

La disponibilidad del proyecto se basa en:

```http
GET /APIpublica/v2/agenda_online/{uuid_agenda}/horarios_disponibles/
```

Con estos query params:

- `uuid_tratamiento`
- `fecha`
- `uuid_sucursal` opcional
- `uuid_profesional` opcional

La funcion actual:

- consulta varias semanas
- normaliza el resultado a `{ "YYYY-MM-DD": ["HH:MM"] }`
- deduplica horarios
- para el dia actual puede descartar cupos ya tomados haciendo una validacion extra con `confirmApptAPI`

Si la otra clinica tiene mas de un tratamiento o mas de un profesional, tienes dos opciones:

1. Dejar un deployment por tratamiento/agenda.
2. Refactorizar para pasar `treatment_uuid`, `sucursal_uuid` y `profesional_uuid` dinamicamente por request.

## Como implementar webhooks

### Requisitos reales

Para que webhooks funcionen bien en este proyecto necesitas:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RESERVO_WEBHOOK_UUID`
- idealmente `RESERVO_WEBHOOK_PUBLIC_KEY`

Sin Supabase:

- el endpoint puede recibir el webhook
- pero la cola y el procesamiento no funcionaran, porque `server/lib/reservo-events.ts` exige Supabase

### Firma digital

Reservo firma el mensaje con:

- header `r-signature-timestamp`
- header `r-signature-ed25519`

El mensaje que se valida es:

```text
timestamp + rawBody
```

La llave publica se obtiene consultando el webhook ya creado.

El proyecto ya implementa eso en:

- `server/lib/reservo-signature.ts`
- `server/lib/reservo-webhooks.ts`
- `server/lib/reservo-events.ts`

### Dedupe

Reservo no garantiza entrega unica.

Por eso este proyecto deduplica por:

- `uuid_evento`

### Cola y reintentos

El worker del proyecto usa este backoff:

- `5s`
- `30s`
- `5m`
- `1h`

Maximo:

- `4` intentos

### Tablas Supabase necesarias para webhooks

Definidas en `supabase/schema.sql`:

- `reservo_webhook_sources`
- `reservo_webhook_events_raw`
- `reservo_patients`
- `reservo_appointments`
- `reservo_sales`
- `lead_reconciliation`
- `reservo_status_map`

## Checklist para dejar operativa una nueva clinica

### Paso 1. Confirmar acceso/API

- Confirmar que la clinica tiene `RESERVO_TOKEN`.
- Confirmar que tiene agenda online activa.
- Confirmar si tiene plan/API habilitada para webhooks.

### Paso 2. Obtener identificadores

- Obtener `RESERVO_AGENDA_UUID` desde la URL de agenda online.
- Obtener `RESERVO_PROFESIONAL_UUID` desde `/profesionales/`.
- Obtener `RESERVO_TREATMENT_UUID` desde `/tratamientos/`.
- Obtener `RESERVO_SUCURSAL_UUID` desde `/sucursales/`.

### Paso 3. Cargar `.env`

- Cargar todos los `RESERVO_*` minimos.
- Cargar `APP_BASE_URL`, `CRON_SECRET`, `METRICS_USER`, `METRICS_PASS`.
- Si vas a usar webhooks, cargar Supabase.

### Paso 4. Probar disponibilidad

```bash
curl "https://tu-dominio/api/reservo/availability"
```

Debes ver:

- `ok: true`
- fechas con horarios

### Paso 5. Probar reserva

Haz una reserva de prueba con `POST /api/bookings`.

Valida:

- respuesta `ok: true`
- `booking_id`
- `schedule_datetime`
- que la cita aparezca efectivamente en Reservo

### Paso 6. Crear webhook

```bash
curl -X POST "https://tu-dominio/api/admin/reservo-webhook/create" \
  -u "$METRICS_USER:$METRICS_PASS" \
  -H "Content-Type: application/json" \
  -d '{
    "email_contacto":"ops@tu-clinica.cl",
    "descripcion":"Webhook Clinica X",
    "url":"https://tu-dominio/api/webhooks/reservo",
    "suscripciones":["citas","pacientes","ventas"]
  }'
```

Guarda:

- `webhook_uuid`
- `public_key`

### Paso 7. Validar webhook

```bash
curl -X POST "https://tu-dominio/api/admin/reservo-webhook/validate" \
  -u "$METRICS_USER:$METRICS_PASS" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"TU_WEBHOOK_UUID"}'
```

### Paso 8. Probar public key

```bash
curl "https://tu-dominio/api/admin/reservo-webhook/public-key?uuid=TU_WEBHOOK_UUID" \
  -u "$METRICS_USER:$METRICS_PASS"
```

### Paso 9. Programar el worker

Programa un cron que llame cada 1-5 minutos:

```bash
curl -X POST "https://tu-dominio/api/jobs/reservo-process?limit=25" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Paso 10. Verificar el ciclo completo

- Crear/editar una cita en Reservo.
- Confirmar que entra a `/api/webhooks/reservo`.
- Confirmar que se guarda en `reservo_webhook_events_raw`.
- Confirmar que el worker la procesa.
- Confirmar que se actualizan `reservo_patients`, `reservo_appointments` o `reservo_sales`.

## Personalizaciones tipicas para otra clinica

### Reglas de UI del calendario

Archivo:

- `src/components/booking/QualifiedCalendarStep.tsx`

Aqui puedes cambiar:

- minimo de anticipacion
- horarios minimos por dia
- reglas para ocultar slots

### Comentario y metadata de la reserva

Archivo:

- `server/lib/reservo.ts`

Funciones relevantes:

- `resolveBookingProcedureName`
- `buildBookingComment`
- `buildBookingDetails`

Aqui puedes cambiar:

- nombre del procedimiento
- texto enviado a `comentario`
- detalle extendido enviado a Reservo

### Estado de citas y mapeo interno

Archivos:

- `server/lib/reservo-events.ts`
- `supabase/schema.sql`

Tabla:

- `reservo_status_map`

Aqui puedes adaptar como mapear estados crudos de Reservo a:

- `confirmed`
- `arrived`
- `attended`
- `no_show`
- `waitlist`
- `suspended`
- `deleted`
- `unknown`

## Si quieres soportar varias clinicas en un mismo backend

La integracion actual no esta hecha para eso, pero el camino es claro.

Tendrias que:

1. Crear una entidad `clinic` o `reservo_config` en base de datos.
2. Guardar por clinica:
   - token
   - api base
   - agenda code
   - treatment uuid
   - sucursal uuid
   - profesional uuid
   - webhook uuid
   - public key
3. Cambiar `getEnv("RESERVO_*")` por un cargador de configuracion por `clinic_id`.
4. Hacer que `GET /api/reservo/availability` reciba `clinic_id`.
5. Hacer que `POST /api/bookings` derive la clinica desde `clinic_id`, `landing_key` o dominio.
6. Guardar el `clinic_id` en booking, lead, webhook y eventos.

Si no necesitas multi-clinic en una sola API, no hagas ese refactor.

La opcion recomendada sigue siendo:

- un deployment por clinica

## Problemas comunes

### Error: falta `RESERVO_AGENDA_UUID`

Sin ese valor no puedes:

- consultar disponibilidad
- descubrir tratamientos
- descubrir sucursales
- descubrir profesionales

### Error: reservas fallan pero disponibilidad funciona

Revisar:

- `RESERVO_SUCURSAL_UUID`
- `RESERVO_TREATMENT_UUID`
- `RESERVO_PROFESIONAL_UUID`
- `RESERVO_BOOKING_URL_CODE`

La disponibilidad usa `uuid_agenda`; la reserva usa ademas sucursal, tratamiento y agenda/profesional.

### Confusion entre `uuid`, `agenda` y `profesional`

Regla practica para este proyecto:

- `RESERVO_AGENDA_UUID`: codigo de agenda online publica
- `RESERVO_PROFESIONAL_UUID`: valor `agenda` que devuelve `/profesionales/`
- `RESERVO_SUCURSAL_UUID`: valor `sucursal` que devuelve `/sucursales/`
- `RESERVO_TREATMENT_UUID`: valor `uuid` que devuelve `/tratamientos/`

### `GET /bookings` devuelve 404

Eso no rompe el flujo principal.

Ese endpoint:

- no se usa para disponibilidad
- no se usa para crear reservas
- puede depender de configuracion/plan aparte

### El webhook entra pero no se procesa

Revisar:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- cron llamando `/api/jobs/reservo-process`
- eventos en `pending` o `failed`

### La firma del webhook falla

Revisar:

- que estas usando el `rawBody` original
- `RESERVO_WEBHOOK_PUBLIC_KEY` correcta
- `RESERVO_WEBHOOK_UUID` correcta
- headers `r-signature-timestamp` y `r-signature-ed25519`

## Referencias oficiales utiles

- Centro de ayuda API Reservo:
  - https://intercom.help/reservo/es/articles/9391606-api-reservo

- Swagger publico de Reservo:
  - https://reservo.cl/APIpublica/v2/documentacion/#/

- Documentacion de agenda online de Reservo:
  - https://www.notion.so/softwarereservo/Documentacion-Endpoint-Agenda-Online-API-EN-DESARROLLO-16-12-2024-11975dda416680f48befc0910065735f

- Documentacion de webhooks de Reservo:
  - https://softwarereservo.notion.site/Webhooks-para-integradores-9a964a9d08854b8bbf5037e9f263721e

## Conclusiones practicas

Para reutilizar este sistema en otra clinica:

1. Consigue `RESERVO_TOKEN`.
2. Consigue `RESERVO_AGENDA_UUID` desde la URL de agenda online.
3. Descubre por API `PROFESIONAL`, `TRATAMIENTO` y `SUCURSAL`.
4. Carga el `.env`.
5. Prueba disponibilidad.
6. Prueba booking.
7. Crea y valida webhook.
8. Activa cron de procesamiento.

Si quieres la opcion mas rapida y menos riesgosa:

- usa este mismo codigo
- crea un deployment separado
- ponle su propio `.env`
- no mezcles dos clinicas en la misma configuracion

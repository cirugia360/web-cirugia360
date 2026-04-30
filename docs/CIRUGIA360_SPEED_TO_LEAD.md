# Cirugia360 Speed To Lead

Backend y dashboard independiente para Cirugia360 inspirado en Medystetic, usando tablas propias `c360_speed_*`.

## Flujos cubiertos

1. `POST /api/cirugia360-speed/contact`
   Crea un lead de contacto inmediato y llama a la asesora por Twilio.
2. `POST /api/bookings`
   Crea la reserva en Reservo y llama a la asesora independiente de si el paciente paga o no.
3. `GET|POST /api/cirugia360-speed/queue-dispatch`
   Procesa la cola de leads pendientes desde Vercel Cron.
4. `POST /api/cirugia360-speed/twilio/*`
   Endpoints internos para voz, estado de llamadas, grabaciones y transcripciones.
5. `/dashboard`
   Dashboard con login Supabase Auth, metricas, pipeline, leads, notas, equipo y botones de llamada.

## Dashboard

Ruta:

```text
/dashboard
```

El dashboard usa Supabase Auth. Debes crear al menos un usuario en Supabase:

```text
Supabase > Authentication > Users > Add user
```

El frontend necesita:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

El backend valida el token del dashboard con:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` debe ser la service role real. Una publishable/anon key no sirve para escribir leads, pipeline, notas ni settings.

## Botones de llamada

Los botones `Llamar` del dashboard no usan llamadas desde navegador. Todos llaman a:

```text
POST /api/cirugia360-speed/dashboard?resource=lead-call
```

Ese endpoint reutiliza el flujo normal:

1. backend llama a la asesora por Twilio
2. la asesora escucha el resumen
3. presiona `1`
4. Twilio conecta con el paciente

## Variables principales

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VALIDATE_SIGNATURE=true

CRON_SECRET=
DEFAULT_COUNTRY_DIAL_CODE=56
CIRUGIA360_STL_BUSINESS_TIME_ZONE=America/Santiago
CIRUGIA360_STL_RETRY_DELAY_SECONDS=180
CIRUGIA360_STL_AGENT_CALL_COOLDOWN_SECONDS=180
CIRUGIA360_STL_QUEUE_PAUSED=false
CIRUGIA360_STL_TRANSCRIPTION_ENABLED=true
CIRUGIA360_STL_TRANSCRIPTION_LANGUAGE_CODE=es-MX
CIRUGIA360_STL_TRANSCRIPTION_ENGINE=google
CIRUGIA360_STL_TRANSCRIPTION_SPEECH_MODEL=telephony
CIRUGIA360_STL_AGENTS_JSON=[{"id":"agent-1","name":"Asesora 1","phone":"+56912345678"}]
```

Las asesoras se pueden guardar desde el dashboard. Si existen settings guardados, tienen prioridad sobre `CIRUGIA360_STL_AGENTS_JSON`.

## Grabacion y transcripcion

Cuando la asesora presiona `1`, Twilio inicia la grabacion y tambien una transcripcion en tiempo real con `both_tracks`.
La app etiqueta `inbound_track` como `Agente` y `outbound_track` como `Cliente`, guarda los segmentos en el lead/eventos y los muestra dentro del cuadro de `Grabacion y transcripcion` del dashboard.

Aplica `supabase/schema.sql` para crear `transcription_segments`. Si la columna aun no existe, el webhook usa `metadata.transcriptionSegments` como respaldo.

## Meta opcional

```env
META_ACCESS_TOKEN=
META_PIXEL_ID=
META_AD_ACCOUNT_ID=
META_API_VERSION=v23.0
META_TEST_EVENT_CODE=
META_EVENT_NAME_LEAD=ProspectCaptured
META_EVENT_NAME_CONTACT=ProspectReached
META_EVENT_NAME_SCHEDULE=ProspectQualified
META_EVENT_NAME_PURCHASE=ProspectClosed
```

Si `META_ACCESS_TOKEN` y `META_PIXEL_ID` no estan definidos, el tracking queda guardado en Supabase pero no se envia a Meta.

## Base de datos

Aplica `supabase/schema.sql` despues de estos cambios. Agrega:

- columnas de pipeline en `public.c360_speed_leads`
- columnas de grabacion/transcripcion en `public.c360_speed_leads`
- `public.c360_speed_lead_notes`
- `public.c360_speed_tracking_events`
- `public.c360_speed_settings`
- `public.c360_claim_due_speed_leads(...)`

## Operacion recomendada

1. Aplicar `supabase/schema.sql`.
2. Configurar variables en Vercel.
3. Crear usuario en Supabase Auth.
4. Entrar a `/dashboard`.
5. Guardar asesoras reales en `Equipo`.
6. Confirmar que Vercel Cron ejecute `/api/cirugia360-speed/queue-dispatch` cada minuto.
7. Probar una reserva real y confirmar que aparece en el dashboard.

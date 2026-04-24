# Cirugia360 Speed To Lead

Backend independiente para Cirugia360 inspirado en la logica de `Speed-to-Lead`, sin depender del proyecto `Mommy Makeover`.

## Flujos cubiertos

1. `POST /api/cirugia360-speed/contact`
   Crea un lead de contacto inmediato y llama a la asesora por Twilio.
2. `POST /api/bookings`
   Crea la reserva en Reservo y, si la reserva sale bien, crea un lead de seguimiento para llamar a la asesora independiente de si el paciente paga o no.
3. `GET|POST /api/cirugia360-speed/queue-dispatch`
   Procesa la cola de leads pendientes y dispara llamadas cuando una asesora queda disponible.
4. `POST /api/cirugia360-speed/twilio/*`
   Endpoints internos para el flujo de voz con Twilio.

## Integracion con Reservo

`POST /api/bookings` mantiene el flujo actual de Reservo y agrega el seguimiento telefonico automatico.

La respuesta agrega:

```json
{
  "bookingFollowUp": {
    "leadId": "uuid",
    "callStarted": true,
    "queued": false,
    "dispatchScheduledAt": "2026-04-23T20:00:00.000Z",
    "bookingReference": "..."
  }
}
```

Si la asesora esta ocupada, Twilio no responde o se alcanza el cooldown, el lead queda en cola y `queue-dispatch` lo reintenta.

## Variables nuevas

```env
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
CIRUGIA360_STL_AGENTS_JSON=[{"id":"agent-1","name":"Asesora 1","phone":"+56912345678"}]
```

## Base de datos

Se agregaron estas entidades a `supabase/schema.sql`:

- `public.c360_speed_leads`
- `public.c360_speed_lead_events`
- `public.c360_claim_due_speed_leads(...)`

Antes de usar el backend nuevo, aplica ese schema en la base de Supabase de Cirugia360.

## Operacion recomendada

1. Configurar Twilio y al menos una asesora.
2. Aplicar `supabase/schema.sql`.
3. Ejecutar `queue-dispatch` cada minuto desde un scheduler externo o desde un cron compatible con esa frecuencia.
4. Probar una reserva real desde la pagina y confirmar que `bookingFollowUp.callStarted` o `bookingFollowUp.queued` vuelva en la respuesta.

## Supuestos actuales

- El backend de Cirugia360 es independiente y usa sus propias tablas.
- Toda persona que agenda desde la pagina genera llamada a asesora, pague o no pague.
- La distribucion entre asesoras usa el orden configurado y rota al siguiente intento si la actual no responde o esta ocupada.

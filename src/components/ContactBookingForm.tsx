import { useState } from "react";
import { Calendar, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

type FormState = {
  rut: string;
  nombre: string;
  apellido: string;
  segundoApellido: string;
  correo: string;
  telefono: string;
};

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

const fields: Array<{
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: "text" | "email";
}> = [
  { key: "rut", label: "RUT", placeholder: "12.345.678-9" },
  { key: "nombre", label: "Nombre", placeholder: "Tu nombre" },
  { key: "apellido", label: "Apellido", placeholder: "Tu apellido" },
  { key: "segundoApellido", label: "Segundo Apellido", placeholder: "Opcional" },
  { key: "correo", label: "Correo Electronico", placeholder: "correo@ejemplo.com", type: "email" },
  { key: "telefono", label: "Telefono", placeholder: "+56 9 1234 5678" },
];

const ContactBookingForm = () => {
  const [step, setStep] = useState<Step>(1);
  const [evalType, setEvalType] = useState<"online" | "presencial" | null>(null);
  const [form, setForm] = useState<FormState>({
    rut: "",
    nombre: "",
    apellido: "",
    segundoApellido: "",
    correo: "",
    telefono: "",
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const canNext = () => {
    if (step === 1) return evalType !== null;
    if (step === 2) return form.rut && form.nombre && form.apellido && form.correo && form.telefono;
    if (step === 3) return selectedDate && selectedTime;
    return true;
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card-premium p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-2 sm:mb-8">
        {[1, 2, 3, 4].map((currentStep) => (
          <div key={currentStep} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-sans font-medium transition-colors ${
                currentStep <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep < step ? <CheckCircle size={14} /> : currentStep}
            </div>
            {currentStep < 4 && (
              <div className={`h-px flex-1 ${currentStep < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Tipo de Evaluacion</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Selecciona el tipo de evaluacion que prefieres.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setEvalType("online")}
              className={`w-full rounded-sm border-2 p-5 text-left transition-all ${
                evalType === "online" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
              type="button"
            >
              <p className="font-serif text-lg font-medium text-foreground">Evaluacion Online</p>
              <p className="mt-1 text-sm text-muted-foreground">Gratuita · Videollamada con el equipo</p>
            </button>
            <button
              onClick={() => setEvalType("presencial")}
              className={`w-full rounded-sm border-2 p-5 text-left transition-all ${
                evalType === "presencial"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
              type="button"
            >
              <p className="font-serif text-lg font-medium text-foreground">Evaluacion Presencial</p>
              <p className="mt-1 text-sm text-muted-foreground">$100.000 · Con el Dr. Torres en clinica</p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Datos Personales</h3>
          <p className="mb-6 text-sm text-muted-foreground">Completa tus datos para agendar.</p>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </label>
                <input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="mb-2 font-serif text-xl font-medium text-foreground">Seleccionar Horario</h3>
          <p className="mb-6 text-sm text-muted-foreground">Elige una fecha y hora disponible.</p>
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm font-sans text-foreground transition-colors focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-3 block text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
              Hora Disponible
            </label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-sm py-3 text-sm font-sans transition-all ${
                    selectedTime === time
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-primary/10"
                  }`}
                  type="button"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="text-primary" size={32} />
          </div>
          <h3 className="mb-3 font-serif text-2xl font-medium text-foreground">Evaluacion Agendada</h3>
          <p className="mb-2 text-muted-foreground">
            {evalType === "online" ? "Evaluacion online gratuita" : "Evaluacion presencial ($100.000)"}
          </p>
          <p className="mb-1 text-sm font-medium text-foreground">
            {form.nombre} {form.apellido}
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            {selectedDate} a las {selectedTime}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-outline-premium flex items-center gap-2 px-6 py-3 text-xs"
            >
              <Calendar size={14} /> Google Calendar
            </button>
            <button
              type="button"
              className="btn-outline-premium flex items-center gap-2 px-6 py-3 text-xs"
            >
              <Calendar size={14} /> Apple Calendar
            </button>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => step > 1 && setStep((step - 1) as Step)}
            className={`flex items-center gap-2 text-sm font-sans text-muted-foreground transition-colors ${
              step === 1 ? "invisible" : "hover:text-foreground"
            }`}
            type="button"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <button
            onClick={() => canNext() && setStep((step + 1) as Step)}
            disabled={!canNext()}
            className={`btn-premium px-8 py-3 text-xs ${!canNext() ? "cursor-not-allowed opacity-40" : ""}`}
            type="button"
          >
            {step === 3 ? "Confirmar" : "Siguiente"} <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactBookingForm;

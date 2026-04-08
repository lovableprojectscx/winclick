import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Check, AlertCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const WHATSAPP   = "51993516053";
const EMAIL      = "Winnersmax369@gmail.com";
// Crea tu formulario gratis en https://formspree.io → pega el ID aquí
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID ?? "";

export default function Contacto() {
  const [sent,        setSent]        = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", message: "" });

  useSEO({
    title: "Contacto Winclick Perú | Soporte y Atención al Socio",
    description: "¿Tienes dudas sobre Winclick? Contáctanos por WhatsApp, email o formulario. Respondemos en menos de 24h. Lima, Perú.",
    canonical: "https://winclick.pe/contacto",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!FORMSPREE_ID) {
      setError("Formulario no configurado. Contáctanos directamente por WhatsApp.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombre:   form.name,
          email:    form.email,
          whatsapp: form.whatsapp,
          mensaje:  form.message,
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("No se pudo enviar. Escríbenos directamente por WhatsApp.");
      }
    } catch {
      setError("Error de conexión. Escríbenos directamente por WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left — Info */}
          <div>
            <h1 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">¿Tienes dudas? Estamos aquí.</h1>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-8">Contáctanos y te responderemos en menos de 24 horas.</p>

            <div className="space-y-4 mb-8">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-11 h-11 rounded-wo-icon bg-wo-carbon flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Mail size={16} />
                </div>
                <span className="font-jakarta text-sm text-wo-crema-muted group-hover:text-wo-crema transition-colors">{EMAIL}</span>
              </a>

              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Winclick, tengo una consulta:")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-11 h-11 rounded-wo-icon bg-wo-carbon flex items-center justify-center text-primary shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <Phone size={16} />
                </div>
                <span className="font-jakarta text-sm text-wo-crema-muted group-hover:text-wo-crema transition-colors">+51 993 516 053 (WhatsApp)</span>
              </a>

              {[
                { icon: <MapPin size={16} />, label: "Lima, Perú" },
                { icon: <Clock size={16} />, label: "Lun - Vie: 9:00 AM - 6:00 PM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-wo-icon bg-wo-carbon flex items-center justify-center text-primary shrink-0">{item.icon}</div>
                  <span className="font-jakarta text-sm text-wo-crema-muted">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Botón WhatsApp directo */}
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Winclick, tengo una consulta:")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-jakarta font-bold text-sm px-5 py-3 rounded-wo-btn hover:bg-[#1ebe5d] transition-colors"
            >
              <Phone size={14} /> Escribir por WhatsApp
            </a>
          </div>

          {/* Right — Form */}
          <div>
            {sent ? (
              <div className="bg-wo-grafito rounded-wo-card p-8 text-center" style={{ border: "0.5px solid rgba(30,192,213,0.3)", background: "rgba(30,192,213,0.05)" }}>
                <Check size={32} className="text-secondary mx-auto mb-4" />
                <h3 className="font-syne font-bold text-lg text-wo-crema mb-2">✓ Mensaje enviado</h3>
                <p className="font-jakarta text-sm text-wo-crema-muted">Te respondemos en menos de 24h a <span className="text-primary">{EMAIL}</span></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: "name",     label: "Nombre",   placeholder: "Tu nombre completo", type: "text",  required: true  },
                  { key: "email",    label: "Email",     placeholder: "tu@email.com",       type: "email", required: true  },
                  { key: "whatsapp", label: "WhatsApp",  placeholder: "+51 987654321",      type: "tel",   required: false },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">
                      {f.label}{f.required && <span className="text-primary ml-0.5">*</span>}
                    </label>
                    <input
                      type={f.type}
                      required={f.required}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">
                    Mensaje<span className="text-primary ml-0.5">*</span>
                  </label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tu consulta o mensaje..."
                    rows={4}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary resize-none"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-wo-btn" style={{ background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
                    <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <p className="font-jakarta text-xs text-destructive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-bounce w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors flex items-center justify-center gap-2 min-h-[52px] disabled:opacity-60"
                >
                  <Send size={14} /> {submitting ? "Enviando..." : "Enviar mensaje"}
                </button>
                <p className="font-jakarta text-[11px] text-wo-crema/30 text-center">
                  Tu mensaje llega directo a {EMAIL}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

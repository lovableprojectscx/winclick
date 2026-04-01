import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Check } from "lucide-react";

export default function Contacto() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Info */}
          <div>
            <h1 className="font-syne font-extrabold text-[26px] text-wo-crema mb-4">¿Tienes dudas? Estamos aquí.</h1>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-8">Contáctanos y te responderemos en menos de 24 horas.</p>

            <div className="space-y-5 mb-8">
              {[
                { icon: <Mail size={16} />, label: "contacto@winnerorgana.com" },
                { icon: <Phone size={16} />, label: "+51 987 654 321 (WhatsApp)" },
                { icon: <MapPin size={16} />, label: "Lima, Perú" },
                { icon: <Clock size={16} />, label: "Lun - Vie: 9:00 AM - 6:00 PM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-wo-icon bg-wo-carbon flex items-center justify-center text-primary">{item.icon}</div>
                  <span className="font-jakarta text-sm text-wo-crema-muted">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {["FB", "IG", "TK"].map((s) => (
                <div key={s} className="w-10 h-10 rounded-full bg-wo-carbon flex items-center justify-center text-wo-crema-muted font-jakarta text-xs font-medium">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Form */}
          <div>
            {sent ? (
              <div className="bg-wo-grafito rounded-wo-card p-8 text-center" style={{ border: "0.5px solid rgba(46,204,113,0.3)", background: "rgba(46,204,113,0.05)" }}>
                <Check size={32} className="text-secondary mx-auto mb-4" />
                <h3 className="font-syne font-bold text-lg text-wo-crema mb-2">✓ Mensaje enviado</h3>
                <p className="font-jakarta text-sm text-wo-crema-muted">Te respondemos en menos de 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: "name", label: "Nombre", placeholder: "Tu nombre", type: "text" },
                  { key: "email", label: "Email", placeholder: "tu@email.com", type: "email" },
                  { key: "whatsapp", label: "WhatsApp", placeholder: "+51 987654321", type: "tel" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Mensaje</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tu mensaje..."
                    rows={4}
                    className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary resize-none"
                    style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors flex items-center justify-center gap-2">
                  <Send size={14} /> Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

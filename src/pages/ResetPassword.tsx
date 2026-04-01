import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const strength = pw.length === 0 ? 0 : pw.length < 4 ? 1 : pw.length < 6 ? 2 : 3;
  const strengthColors = ["", "bg-destructive", "bg-primary", "bg-secondary"];
  const strengthLabels = ["", "Débil", "Media", "Fuerte"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2 || pw.length < 6) return;
    setStatus("success");
  };

  return (
    <div className="min-h-screen bg-background pt-24 flex items-center justify-center px-4">
      <div className="bg-wo-grafito rounded-2xl p-10 w-full max-w-[420px]" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
        {status === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="font-syne font-bold text-[22px] text-wo-crema">Nueva contraseña</h2>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
              {pw.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 rounded bg-wo-crema/10 overflow-hidden">
                    <div className={`h-full ${strengthColors[strength]} transition-all`} style={{ width: `${(strength / 3) * 100}%` }} />
                  </div>
                  <span className={`font-jakarta text-[10px] ${strength === 1 ? "text-destructive" : strength === 2 ? "text-primary" : "text-secondary"}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <input type={showPw2 ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repite tu contraseña" className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary" style={{ border: pw2 && pw !== pw2 ? "0.5px solid hsl(var(--destructive))" : "0.5px solid rgba(255,255,255,0.1)" }} />
                <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">{showPw2 ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors">
              Actualizar contraseña
            </button>
          </form>
        )}

        {status === "success" && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto">
              <Check size={28} className="text-secondary" />
            </div>
            <h3 className="font-syne font-bold text-lg text-wo-crema">Contraseña actualizada</h3>
            <Link to="/login-afiliado" className="inline-block font-jakarta text-sm text-wo-crema/80 px-5 py-2.5 rounded-wo-btn hover:text-wo-crema" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>
              Ir al login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <h3 className="font-syne font-bold text-lg text-wo-crema">Enlace inválido o expirado</h3>
            <button onClick={() => setStatus("form")} className="inline-block font-jakarta text-sm text-wo-crema/80 px-5 py-2.5 rounded-wo-btn hover:text-wo-crema" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>
              Solicitar nuevo enlace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

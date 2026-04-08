import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email !== "admin@winner.com") {
      setError("Acceso restringido. Esta página es solo para administradores.");
      return;
    }
    const ok = login(email, password);
    if (ok) {
      navigate("/admin-dashboard");
    } else {
      setError("Credenciales incorrectas.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-wo-pill" style={{ background: "rgba(231,76,60,0.1)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
            <Shield size={14} className="text-destructive" />
            <span className="font-jakarta font-bold text-xs text-destructive">Acceso restringido — Solo admin</span>
          </div>
        </div>

        <div className="bg-wo-grafito rounded-wo-card p-8" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
          <h1 className="font-syne font-extrabold text-[24px] text-wo-crema mb-1">Panel de administración</h1>
          <p className="font-jakarta text-xs text-wo-crema-muted mb-8">Winclick · Acceso interno</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Email de administrador</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@winner.com"
                required
                className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-destructive"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de admin"
                  required
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 pr-10 rounded-wo-btn outline-none focus:ring-1 focus:ring-destructive"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-wo-btn px-4 py-3" style={{ background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.3)" }}>
                <p className="font-jakarta text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full font-jakarta font-bold text-sm py-4 rounded-wo-btn transition-colors mt-2"
              style={{ background: "rgba(231,76,60,0.15)", color: "rgb(231,76,60)", border: "0.5px solid rgba(231,76,60,0.4)" }}
            >
              Ingresar al panel →
            </button>
          </form>
        </div>

        <p className="font-jakarta text-[11px] text-wo-crema/20 text-center mt-6">
          Esta URL no está enlazada desde el sitio público.
        </p>
      </div>
    </div>
  );
}

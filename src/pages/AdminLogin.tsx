import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const isDev = import.meta.env.DEV;

// ─── Cuentas rápidas de testeo (solo visible en DEV) ──────────────────────────
const DEV_ACCOUNTS = [
  { label: "Admin", email: "admin@idenza.site", password: "admin123456" },
];

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email !== "admin@idenza.site") {
      setError("Acceso restringido. Esta página es solo para administradores.");
      return;
    }
    setLoading(true);
    const { error: loginError } = await login(email, password);
    setLoading(false);
    if (loginError) { setError("Credenciales incorrectas."); return; }
    navigate("/admin-dashboard");
  };

  const quickLogin = async (acc: { email: string; password: string }) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
    setLoading(true);
    const { error: loginError } = await login(acc.email, acc.password);
    setLoading(false);
    if (loginError) { setError(`Error: ${loginError}`); return; }
    navigate("/admin-dashboard");
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
                placeholder="admin@idenza.site"
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
              disabled={loading}
              className="w-full font-jakarta font-bold text-sm py-4 rounded-wo-btn transition-colors mt-2 disabled:opacity-60"
              style={{ background: "rgba(231,76,60,0.15)", color: "rgb(231,76,60)", border: "0.5px solid rgba(231,76,60,0.4)" }}
            >
              {loading ? "Ingresando..." : "Ingresar al panel →"}
            </button>
          </form>
        </div>

        <p className="font-jakarta text-[11px] text-wo-crema/20 text-center mt-6">
          Esta URL no está enlazada desde el sitio público.
        </p>

        {/* ── DEV: Acceso rápido ── */}
        {isDev && (
          <div className="mt-6 rounded-wo-card p-4" style={{ background: "rgba(255,200,0,0.05)", border: "0.5px solid rgba(255,200,0,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} className="text-yellow-400" />
              <span className="font-jakarta font-bold text-[11px] text-yellow-400">DEV · Acceso rápido</span>
            </div>
            <div className="space-y-2">
              {DEV_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => quickLogin(acc)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-wo-btn font-jakarta text-xs text-wo-crema hover:bg-wo-carbon transition-colors disabled:opacity-60"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  <span className="font-bold text-yellow-400">{acc.label}</span>
                  <span className="text-wo-crema-muted ml-2">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

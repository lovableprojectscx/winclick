import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function LoginAfiliado() {
  const { login, isAdmin, role, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [showPw,         setShowPw]         = useState(false);
  const [showRecovery,   setShowRecovery]   = useState(false);
  const [recoveryEmail,  setRecoveryEmail]  = useState("");
  const [recoverySent,   setRecoverySent]   = useState(false);
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [pendingNav,     setPendingNav]     = useState(false);

  // Navegar cuando el rol cargue después del login
  useEffect(() => {
    if (pendingNav && !authLoading && role !== null) {
      setPendingNav(false);
      if (isAdmin) navigate("/admin-dashboard");
      else navigate("/area-afiliado");
    }
  }, [pendingNav, authLoading, role, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await login(email, password);
    setLoading(false);

    if (loginError) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    // Esperar a que AuthContext cargue el rol, luego navegar
    setPendingNav(true);
  };

  const handleRecovery = async () => {
    if (!recoveryEmail) return;
    await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setRecoverySent(true);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--wo-obsidiana)), hsl(var(--wo-grafito)))" }}>
          <div className="absolute top-20 right-20 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(242,201,76,0.12) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="font-syne font-extrabold text-[36px] text-wo-crema leading-tight mb-6">
              Bienvenido de vuelta<br />a <span className="text-primary">tu negocio.</span>
            </h2>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-8">Tu red sigue creciendo mientras no estás.</p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-wo-pill" style={{ background: "rgba(46,204,113,0.12)", border: "0.5px solid rgba(46,204,113,0.25)" }}>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-jakarta text-xs text-secondary font-medium">+2,400 socios activos ahora</span>
            </span>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex items-center justify-center p-8 lg:p-12 bg-wo-grafito">
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
            <h2 className="font-syne font-bold text-[24px] text-wo-crema mb-2">Iniciar sesión</h2>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Tu contraseña"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wo-crema-muted">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button type="button" onClick={() => setShowRecovery(!showRecovery)} className="block font-jakarta text-xs text-primary hover:underline mt-2 ml-auto">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p className="font-jakarta text-xs text-destructive px-1">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar sesión →"}
            </button>

            {/* Recovery */}
            {showRecovery && (
              <div className="bg-wo-carbon rounded-wo-btn p-4 space-y-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                {!recoverySent ? (
                  <>
                    <input
                      type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Tu email"
                      className="w-full bg-wo-grafito font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-2.5 rounded-wo-btn outline-none"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                    <button
                      type="button" onClick={handleRecovery}
                      className="w-full font-jakarta font-bold text-xs text-wo-crema/80 py-2.5 rounded-wo-btn hover:text-wo-crema"
                      style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}
                    >
                      Enviar enlace
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-secondary">
                    <Check size={14} />
                    <span className="font-jakarta text-sm">Enlace enviado a tu correo</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-wo-crema/10" />
              <span className="font-jakarta text-xs text-wo-crema-muted">o</span>
              <div className="flex-1 h-px bg-wo-crema/10" />
            </div>

            <p className="text-center font-jakarta text-sm text-wo-crema-muted">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/registro-afiliado" className="text-primary hover:underline font-semibold">Regístrate gratis</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

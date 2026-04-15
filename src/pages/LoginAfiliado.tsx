import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const isDev = import.meta.env.DEV;

// ─── Cuentas de afiliado para testeo rápido (solo DEV) ───────────────────────
const DEV_AFFILIATES = [
  { label: "Afiliado 1", email: "prueba@gmail.com", password: "test123456" },
  { label: "Afiliado 2", email: "afiliado2@test.com", password: "test123456" },
  { label: "Afiliado 3", email: "afiliado3@test.com", password: "test123456" },
];

export default function LoginAfiliado() {
  const { login, isAdmin, role, loading: authLoading, session: existingSession } = useAuth();
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

  // Si ya hay sesión activa, redirigir directamente
  useEffect(() => {
    if (!authLoading && existingSession && !pendingNav) {
      if (isAdmin) navigate("/admin-dashboard", { replace: true });
      else navigate("/area-afiliado", { replace: true });
    }
  }, [authLoading, existingSession, isAdmin, navigate, pendingNav]);

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
    if (loginError) { setError("Email o contraseña incorrectos."); return; }
    setPendingNav(true);
  };

  const handleRecovery = async () => {
    if (!recoveryEmail) return;
    await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setRecoverySent(true);
  };

  const quickLogin = async (acc: { email: string; password: string }) => {
    setError("");
    setLoading(true);
    const { error: loginError } = await login(acc.email, acc.password);
    setLoading(false);
    if (loginError) { setError(`No existe: ${acc.email}`); return; }
    setPendingNav(true);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left panel — foto lifestyle (solo desktop) */}
        <div className="hidden lg:block relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=1080&fit=crop&crop=top&auto=format&q=85"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,12,28,0.88) 0%, rgba(5,12,28,0.55) 100%)" }} />
          <div className="relative z-10 h-full flex flex-col justify-center p-12">
            <h2 className="font-syne font-extrabold text-[38px] text-wo-crema leading-[1.1] mb-5">
              Bienvenido de vuelta<br />a <span className="text-primary">tu negocio.</span>
            </h2>
            <p className="font-jakarta text-[15px] text-wo-crema-muted mb-10 max-w-xs">
              Tu red sigue creciendo mientras no estás. Revisa tus comisiones del día.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-wo-pill w-fit" style={{ background: "rgba(30,192,213,0.12)", border: "0.5px solid rgba(30,192,213,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-jakarta text-xs text-secondary font-semibold">+2,400 socios activos ahora</span>
            </span>
          </div>
        </div>

        {/* Right — Form */}
        <div className="flex items-center justify-center px-5 py-10 sm:p-8 lg:p-12 bg-wo-grafito">
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-6">
              <img src="/logo-winclick.png" alt="Winclick" className="h-10 w-auto mx-auto mb-2" />
            </div>

            <h2 className="font-syne font-bold text-[24px] text-wo-crema mb-1">Iniciar sesión</h2>
            <p className="font-jakarta text-sm text-wo-crema-muted mb-2">Accede a tu área de socio</p>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            <div>
              <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Tu contraseña"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3.5 pr-12 rounded-wo-btn outline-none focus:ring-1 focus:ring-primary min-h-[48px]"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-0 h-full px-4 text-wo-crema-muted hover:text-wo-crema transition-colors"
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="button" onClick={() => setShowRecovery(!showRecovery)} className="block font-jakarta text-xs text-primary hover:underline mt-2 ml-auto py-1">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <p className="font-jakarta text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors disabled:opacity-60 min-h-[52px]"
            >
              {loading ? "Ingresando..." : "Iniciar sesión →"}
            </button>

            {/* Recovery */}
            {showRecovery && (
              <div className="bg-wo-carbon rounded-wo-btn p-4 space-y-3" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                {!recoverySent ? (
                  <>
                    <p className="font-jakarta text-xs text-wo-crema-muted">Ingresa tu email para recibir el enlace de recuperación</p>
                    <input
                      type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-wo-grafito font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none min-h-[44px]"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    />
                    <button
                      type="button" onClick={handleRecovery}
                      className="w-full font-jakarta font-bold text-sm text-wo-crema/80 py-3 rounded-wo-btn hover:text-wo-crema min-h-[44px]"
                      style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}
                    >
                      Enviar enlace
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-secondary py-1">
                    <Check size={16} />
                    <span className="font-jakarta text-sm">Enlace enviado a tu correo</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-wo-crema/10" />
              <span className="font-jakarta text-xs text-wo-crema-muted">o</span>
              <div className="flex-1 h-px bg-wo-crema/10" />
            </div>

            <p className="text-center font-jakarta text-sm text-wo-crema-muted">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/registro-afiliado" className="text-primary hover:underline font-semibold">Regístrate gratis</Link>
            </p>

            {/* ── DEV: Acceso rápido ── */}
            {isDev && (
              <div className="mt-2 rounded-wo-card p-4" style={{ background: "rgba(255,200,0,0.05)", border: "0.5px solid rgba(255,200,0,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={12} className="text-yellow-400" />
                  <span className="font-jakarta font-bold text-[11px] text-yellow-400">DEV · Afiliados de prueba</span>
                  <Link to="/dev-tools" className="ml-auto font-jakarta text-[10px] text-yellow-400/70 hover:text-yellow-400 underline">Panel completo →</Link>
                </div>
                <div className="space-y-1.5">
                  {DEV_AFFILIATES.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => quickLogin(acc)}
                      disabled={loading}
                      className="w-full text-left px-3 py-2 rounded-wo-btn font-jakarta text-xs text-wo-crema hover:bg-wo-carbon transition-colors disabled:opacity-60"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                    >
                      <span className="font-bold text-yellow-400">{acc.label}</span>
                      <span className="tex
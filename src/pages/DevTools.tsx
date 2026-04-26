import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Zap, Users, Shield, RefreshCw, UserPlus, Trash2,
  CheckCircle, XCircle, Copy, ExternalLink, Terminal,
  AlertTriangle, Info,
} from "lucide-react";

// ─── Solo disponible en desarrollo ───────────────────────────────────────────
if (!import.meta.env.DEV) {
  throw new Error("DevTools no disponible en producción");
}

const ADMIN_ACCOUNT = { role: "admin", label: "Admin", email: "admin@idenza.site", password: "admin123456", dest: "/admin-dashboard" };

// ─── Generador de datos ficticios ─────────────────────────────────────────────
function randomName() {
  const first = ["Carlos","María","Luis","Ana","Pedro","Rosa","Javier","Carmen","Diego","Elena"];
  const last  = ["García","López","Martínez","Pérez","Sánchez","Gomez","Flores","Torres","Ramírez","Cruz"];
  return `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]}`;
}
function randomDni() { 
  // 8 dígitos aleatorios + sufijo de tiempo para evitar colisiones
  return String(Math.floor(10000000 + Math.random() * 89999999)); 
}
function randomYape() { return "9" + String(Math.floor(10000000 + Math.random() * 89999999)); }
function randomEmail(name: string) {
  const ts = Date.now().toString().slice(-6);
  const cleanName = name.toLowerCase().replace(/\s/g,".");
  return `${cleanName}.${ts}@test.com`;
}
const PACKAGES = ["Básico", "Intermedio", "VIP"] as const;

const cardStyle = { border: "0.5px solid rgba(255,255,255,0.08)" };
const rowBorder = { borderBottom: "0.5px solid rgba(255,255,255,0.07)" };

type Log = { type: "ok"|"err"|"info"; msg: string };

export default function DevTools() {
  const { login, logout, session } = useAuth();
  const navigate = useNavigate();

  const [logs,     setLogs]     = useState<Log[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [qty,      setQty]      = useState(3);
  const [pkg,      setPkg]      = useState<typeof PACKAGES[number]>("Básico");
  const [refCode,  setRefCode]  = useState("");
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);

  // Cargar afiliados al montar
  useEffect(() => {
    loadAffiliates();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const log  = (msg: string) => setLogs((p) => [{ type: "ok",   msg }, ...p]);
  const err  = (msg: any) => {
    let message = "Error desconocido";
    if (typeof msg === "string") message = msg;
    else if (msg?.message) {
      message = msg.message;
      if (msg.details) message += ` | Detalle: ${msg.details}`;
      if (msg.hint) message += ` | Tip: ${msg.hint}`;
    }
    setLogs((p) => [{ type: "err",  msg: message }, ...p]);
  };
  const info = (msg: string) => setLogs((p) => [{ type: "info", msg }, ...p]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    info(`Copiado: ${text}`);
  };

  // ── Login rápido ─────────────────────────────────────────────────────────────
  const quickLogin = async (acc: { label: string; email: string; password?: string; dest: string; role: string }) => {
    info(`Iniciando sesión como ${acc.label}...`);
    setLoading(true);
    const password = acc.password || "test123456";
    const { error: loginErr } = await login(acc.email, password);
    setLoading(false);
    if (loginErr) { err(`Login fallido: ${loginErr}`); return; }
    log(`✓ Sesión iniciada como ${acc.label}`);
    navigate(acc.dest);
  };

  // ── Cerrar sesión ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    log("Sesión cerrada.");
  };

  // ── Crear afiliados bulk ─────────────────────────────────────────────────────
  const createBulkAffiliates = async () => {
    info(`Creando ${qty} afiliado(s) con paquete ${pkg}...`);
    setLoading(true);

    for (let i = 0; i < qty; i++) {
      const name     = randomName();
      const email    = randomEmail(name);
      const password = "test123456";
      const dni      = randomDni();
      const yape     = randomYape();
      const prefix   = "WIN-" + name.substring(0,3).toUpperCase();
      const ts       = Date.now().toString().slice(-3);
      const code     = prefix + ts + Math.floor(Math.random()*99);

      // 1. Crear usuario auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      
      if (authErr) {
        if (authErr.message.includes("60 seconds") || authErr.code === "signup_email_confirm_once_every_60_seconds") {
          setShowRateLimitWarning(true);
          err(`[${i+1}] Límite de Supabase alcanzado: Espera 60s o desactiva 'Confirm Email' en el Dashboard.`);
        } else {
          err(authErr);
        }
        continue;
      }
      
      if (!authData.user) {
        err(`[${i+1}] Error: No se pudo obtener el ID del usuario creado.`);
        continue;
      }

      const userId = authData.user.id;

      // 2. Buscar referidor si hay código
      let referrerId: string | undefined;
      if (refCode.trim()) {
        const { data: ref } = await supabase
          .from("affiliates").select("id").eq("affiliate_code", refCode.trim().toUpperCase()).single();
        referrerId = ref?.id;
      }

      // 3. Registrar afiliado
      const { error: regErr } = await supabase.rpc("register_affiliate", {
        p_user_id:        userId,
        p_name:           name,
        p_dni:            dni,
        p_email:          email,
        p_affiliate_code: code,
        p_yape_number:    yape,
        p_package:        pkg,
        p_referred_by:    referrerId ?? null,
      });

      if (regErr) { err(regErr); continue; }

      // 4. Rol affiliate
      await supabase.from("user_roles").insert({ user_id: userId, role: "affiliate" });

      log(`[${i+1}] ✓ ${name} · ${email} · ${code} · pass: test123456`);
    }

    setLoading(false);
    info("Proceso completado.");
    loadAffiliates();
  };

  // ── Listar afiliados ─────────────────────────────────────────────────────────
  const [affiliates, setAffiliates] = useState<{ id: string; name: string; email: string; affiliate_code: string; package: string; account_status: string }[]>([]);
  const [loadingAff, setLoadingAff] = useState(false);

  const loadAffiliates = async () => {
    setLoadingAff(true);
    // Usamos columnas específicas para evitar errores 406 de caché/joins complejos
    const { data, error: affErr } = await supabase
      .from("affiliates")
      .select("id, name, email, affiliate_code, package, account_status")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (affErr) {
      err(`Error al cargar afiliados (406?): ${affErr.message}`);
    } else {
      setAffiliates(data ?? []);
    }
    setLoadingAff(false);
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">

      {/* Header */}
      <div className="bg-wo-grafito sticky top-16 z-10" style={rowBorder}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-wo-pill" style={{ background: "rgba(255,200,0,0.08)", border: "0.5px solid rgba(255,200,0,0.25)" }}>
            <Terminal size={12} className="text-yellow-400" />
            <span className="font-jakarta font-extrabold text-[11px] text-yellow-400">DEV TOOLS · Solo desarrollo</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {session
              ? <span className="font-jakarta text-[11px] text-wo-crema-muted">Sesión: <span className="text-secondary font-bold">{session.user.email}</span></span>
              : <span className="font-jakarta text-[11px] text-wo-crema-muted">Sin sesión</span>
            }
            {session && (
              <button onClick={handleLogout} className="font-jakarta text-[11px] font-bold text-destructive hover:underline">
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Tips de Configuración ─────────────────────────────────────────── */}
        <section className="bg-blue-500/10 border border-blue-500/20 rounded-wo-card p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-sm text-blue-400 mb-1">Tip de Desarrollo: Crear afiliados sin esperas</h3>
              <p className="font-jakarta text-[11px] text-blue-100/70 leading-relaxed">
                Por defecto, Supabase solo permite crear 1 cuenta por minuto. Para ignorar este límite en desarrollo:<br/>
                <span className="font-bold text-blue-300">Supabase Dashboard › Authentication › Settings › Desactivar "Confirm Email"</span>.
              </p>
            </div>
          </div>
        </section>

        {showRateLimitWarning && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-wo-card p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle size={16} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-sm text-destructive mb-1">¡Límite de velocidad alcanzado!</h3>
                <p className="font-jakarta text-[11px] text-destructive/80 leading-relaxed">
                  Supabase te ha bloqueado temporalmente por crear cuentas demasiado rápido. 
                  Debes esperar 60 segundos antes de intentar crear el siguiente afiliado o seguir el tip de arriba.
                </p>
                <button 
                  onClick={() => setShowRateLimitWarning(false)}
                  className="mt-2 font-jakarta text-[10px] font-bold uppercase tracking-wider text-destructive hover:underline"
                >
                  Entendido, cerrar aviso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Login ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-yellow-400" />
            <h2 className="font-syne font-bold text-base text-wo-crema">Acceso rápido 1-click</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Admin (Siempre visible) */}
            <button
              onClick={() => quickLogin(ADMIN_ACCOUNT)}
              disabled={loading}
              className="relative flex flex-col gap-1 p-4 rounded-wo-card text-left hover:border-destructive/40 transition-all disabled:opacity-60 group"
              style={cardStyle}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield size={12} className="text-destructive" />
                <span className="font-jakarta font-bold text-[10px] text-destructive">ADMIN</span>
              </div>
              <p className="font-syne font-bold text-sm text-wo-crema">{ADMIN_ACCOUNT.label}</p>
              <p className="font-jakarta text-[10px] text-wo-crema-muted truncate">{ADMIN_ACCOUNT.email}</p>
              <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 rounded-wo-card transition-opacity" />
            </button>

            {/* Afiliados Reales de la DB */}
            {affiliates.slice(0, 3).map((acc) => (
              <button
                key={acc.id}
                onClick={() => quickLogin({
                  label: acc.name,
                  email: acc.email,
                  dest: "/area-afiliado",
                  role: "affiliate"
                })}
                disabled={loading}
                className="relative flex flex-col gap-1 p-4 rounded-wo-card text-left hover:border-secondary/40 transition-all disabled:opacity-60 group"
                style={cardStyle}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={12} className="text-secondary" />
                  <span className="font-jakarta font-bold text-[10px] text-secondary">AFFILIATE</span>
                </div>
                <p className="font-syne font-bold text-sm text-wo-crema truncate">{acc.name}</p>
                <p className="font-jakarta text-[10px] text-wo-crema-muted truncate">{acc.email}</p>
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 rounded-wo-card transition-opacity" />
              </button>
            ))}

            {affiliates.length === 0 && !loadingAff && (
              <div className="col-span-3 py-6 flex items-center justify-center opacity-30 border border-dashed border-white/10 rounded-wo-card">
                <p className="font-jakarta text-[10px] italic">No hay afiliados recientes para login rápido</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Crear afiliados bulk ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={14} className="text-yellow-400" />
              <h2 className="font-syne font-bold text-base text-wo-crema">Crear afiliados de prueba</h2>
            </div>
            <div className="bg-wo-grafito rounded-wo-card p-5 space-y-4" style={cardStyle}>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Cantidad</label>
                <input
                  type="number" min={1} max={20} value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-yellow-400/50"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">Paquete</label>
                <select
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value as typeof PACKAGES[number])}
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-yellow-400/50"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  {PACKAGES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-jakarta text-xs text-wo-crema-muted font-medium mb-1.5">
                  Código referente <span className="text-wo-crema/30">(opcional)</span>
                </label>
                <input
                  type="text" value={refCode} onChange={(e) => setRefCode(e.target.value)}
                  placeholder="WIN-XXX000"
                  className="w-full bg-wo-carbon font-jakarta text-sm text-wo-crema placeholder:text-wo-crema/30 px-4 py-3 rounded-wo-btn outline-none focus:ring-1 focus:ring-yellow-400/50"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <button
                onClick={createBulkAffiliates}
                disabled={loading}
                className="w-full font-jakarta font-bold text-sm py-3 rounded-wo-btn transition-colors disabled:opacity-60"
                style={{ background: "rgba(255,200,0,0.12)", color: "rgb(255,200,0)", border: "0.5px solid rgba(255,200,0,0.3)" }}
              >
                {loading ? "Creando..." : `⚡ Crear ${qty} afiliado(s)`}
              </button>
              <p className="font-jakarta text-[10px] text-wo-crema/30">
                Contraseña automática: <span className="text-yellow-400/70">test123456</span>
              </p>
            </div>
          </section>

          {/* ── Afiliados existentes ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-yellow-400" />
                <h2 className="font-syne font-bold text-base text-wo-crema">Afiliados en DB</h2>
              </div>
              <button
                onClick={loadAffiliates}
                disabled={loadingAff}
                className="flex items-center gap-1.5 font-jakarta text-[11px] font-bold text-yellow-400/80 hover:text-yellow-400 px-3 py-1.5 rounded-wo-pill transition-colors"
                style={{ border: "0.5px solid rgba(255,200,0,0.2)" }}
              >
                <RefreshCw size={11} className={loadingAff ? "animate-spin" : ""} />
                Cargar
              </button>
            </div>
            <div className="bg-wo-grafito rounded-wo-card overflow-hidden" style={cardStyle}>
              {affiliates.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-jakarta text-xs text-wo-crema-muted">
                    {loadingAff ? "Cargando..." : "Haz clic en \"Cargar\" para ver los afiliados"}
                  </p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[360px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={rowBorder}>
                        {["Nombre","Email","Código","Paquete","Estado"].map((h) => (
                          <th key={h} className="px-3 py-2 font-jakarta text-[10px] text-wo-crema-muted uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {affiliates.map((a) => (
                        <tr key={a.id} style={rowBorder} className="hover:bg-wo-carbon/30 transition-colors">
                          <td className="px-3 py-2 font-jakarta text-xs text-wo-crema">{a.name}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <span className="font-jakarta text-[10px] text-wo-crema-muted truncate max-w-[120px]">{a.email}</span>
                              <button onClick={() => copyToClipboard(a.email)} className="text-wo-crema/20 hover:text-yellow-400 transition-colors shrink-0">
                                <Copy size={9} />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => copyToClipboard(a.affiliate_code)} className="flex items-center gap-1 font-jakarta text-[10px] font-bold text-primary hover:text-yellow-400 transition-colors">
                              {a.affiliate_code} <Copy size={9} />
                            </button>
                          </td>
                          <td className="px-3 py-2 font-jakarta text-[10px] text-wo-crema-muted">{a.package}</td>
                          <td className="px-3 py-2">
                            <span className={`font-jakarta text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              a.account_status === "active" ? "bg-secondary/15 text-secondary" :
                              a.account_status === "suspended" ? "bg-destructive/15 text-destructive" :
                              "bg-primary/15 text-primary"
                            }`}>
                              {a.account_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Links rápidos ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink size={14} className="text-yellow-400" />
            <h2 className="font-syne font-bold text-base text-wo-crema">Navegación rápida</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Inicio",          path: "/" },
              { label: "Catálogo",        path: "/catalogo" },
              { label: "Admin Dashboard", path: "/admin-dashboard" },
              { label: "Login Afiliado",  path: "/login-afiliado" },
              { label: "Área Afiliado",   path: "/area-afiliado" },
              { label: "Mi Billetera",    path: "/mi-billetera" },
              { label: "Registro",        path: "/registro-afiliado" },
            ].map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className="font-jakarta text-xs font-medium px-4 py-2 rounded-wo-pill transition-colors hover:border-yellow-400/40 hover:text-yellow-400"
                style={cardStyle}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Consola de logs ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-yellow-400" />
              <h2 className="font-syne font-bold text-base text-wo-crema">Consola</h2>
            </div>
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1 font-jakarta text-[11px] text-wo-crema-muted hover:text-destructive transition-colors"
            >
              <Trash2 size={11} /> Limpiar
            </button>
          </div>
          <div
            className="bg-wo-obsidiana rounded-wo-card p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto"
            style={cardStyle}
          >
            {logs.length === 0 ? (
              <span className="text-wo-crema/20">— Esperando acciones...</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={`flex items-start gap-2 ${
                  l.type === "ok"   ? "text-secondary" :
                  l.type === "err"  ? "text-destructive" :
                  "text-wo-crema-muted"
                }`}>
                  {l.type === "ok"  && <CheckCircle size={11} className="mt-0.5 shrink-0" />}
                  {l.type === "err" && <XCircle     size={11} className="mt-0.5 shrink-0" />}
                  {l.type === "info" && <span className="w-[11px] shrink-0">›</span>}
                  <span>{l.msg}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

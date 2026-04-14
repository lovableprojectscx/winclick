import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Affiliate, PackageType } from "@/lib/database.types";

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type { PackageType };

export interface AuthContextType {
  session:    Session | null;
  affiliate:  Affiliate | null;
  role:       "affiliate" | "admin" | null;
  isAdmin:    boolean;
  loading:    boolean;
  login:      (email: string, password: string) => Promise<{ error: string | null }>;
  register:   (data: RegisterData) => Promise<{ error: string | null }>;
  logout:     () => Promise<void>;
}

export interface RegisterData {
  name:         string;
  email:        string;
  password:     string;
  dni:          string;
  yapeNumber:   string;
  packageType:  PackageType;
  referralCode?: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [role,      setRole]      = useState<"affiliate" | "admin" | null>(null);
  const [loading,   setLoading]   = useState(true);

  // ── Cargar sesión inicial y suscribirse a cambios ─────────────────────────
  useEffect(() => {
    let isInitializationBound = true;

    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isInitializationBound) return;

      if (initialSession) {
        setSession(initialSession);
        loadProfile(initialSession.user.id, true).finally(() => {
          if (isInitializationBound) setLoading(false);
          isInitializationBound = false;
        });
      } else {
        setLoading(false);
        isInitializationBound = false;
      }
    });

    // 2. Escuchar cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      // Si estamos en medio del getSession inicial, ignorar este evento
      if (isInitializationBound && _event === "INITIAL_SESSION") return;

      setSession(currentSession);
      if (currentSession) {
        // En cambios posteriores (refresh, etc), no bloqueamos la UI con el loader global
        loadProfile(currentSession.user.id, false);
      } else {
        setAffiliate(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isInitializationBound = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Cargar perfil del afiliado y su rol ───────────────────────────────────
  async function loadProfile(userId: string, isInitial = true) {
    if (isInitial) setLoading(true);
    try {
      // Rol del usuario
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const userRole = (roleData?.role as "affiliate" | "admin") ?? "affiliate";
      setRole(userRole);

      // Perfil de afiliado (admin también puede tener registro en affiliates)
      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      setAffiliate(affiliateData ?? null);
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  async function login(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  // ── REGISTER ─────────────────────────────────────────────────────────────
  async function register(data: RegisterData): Promise<{ error: string | null }> {
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
    });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "No se pudo crear el usuario" };

    const userId = authData.user.id;

    // 2. Generar código de afiliado único
    const prefix = "WIN-" + data.name.substring(0, 3).toUpperCase();
    let code = prefix + Math.floor(Math.random() * 900 + 100);

    const { count } = await supabase
      .from("affiliates")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_code", code);

    if (count && count > 0) code = prefix + Math.floor(Math.random() * 900 + 100);

    // 3. Buscar referidor si viene código
    let referrerId: string | undefined;
    if (data.referralCode) {
      const { data: referrer } = await supabase
        .from("affiliates")
        .select("id")
        .eq("affiliate_code", data.referralCode.toUpperCase())
        .maybeSingle();
      referrerId = referrer?.id;
    }

    // 4. Llamar a register_affiliate (crea affiliates + referrals tree)
    const { error: regError } = await supabase.rpc("register_affiliate", {
      p_user_id:       userId,
      p_name:          data.name,
      p_dni:           data.dni,
      p_email:         data.email,
      p_affiliate_code: code,
      p_yape_number:   data.yapeNumber,
      p_package:       data.packageType,
      p_referred_by:   referrerId ?? null,
    });

    if (regError) return { error: regError.message };

    // 5. Asignar rol 'affiliate'
    await supabase.from("user_roles").insert({ user_id: userId, role: "affiliate" });

    return { error: null };
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      session,
      affiliate,
      role,
      isAdmin: role === "admin",
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

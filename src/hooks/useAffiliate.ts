import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Commission, CreditTransaction, AffiliatePayment, PackageType, StoreConfig, BusinessSettings } from "@/lib/database.types";
export type { StoreConfig };

// ─── Obtener y Actualizar perfil de afiliado ───────────────────────────────────

export function useProfile() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["affiliate-profile"],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from("affiliates").select("*").eq("user_id", session.user.id).maybeSingle();
      return data ?? null;
    },
    enabled: !!session?.user?.id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async (fields: { shipping_address?: string; shipping_city?: string; yape_number?: string; phone?: string; dni?: string }) => {
      if (!session?.user?.id) throw new Error("No autenticado");
      const { error } = await supabase
        .from("affiliates")
        .update(fields)
        .eq("user_id", session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-profile"] });
    },
  });
}

// ─── Configuración del negocio (pública) ─────────────────────────────────────

export function useBusinessSettings() {
  return useQuery<BusinessSettings | null>({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("business_settings").select("*").maybeSingle();
      return data ?? null;
    },
    staleTime: 300_000,
  });
}

// ─── Dashboard del afiliado ───────────────────────────────────────────────────

export function useAffiliateStats() {
  const { affiliate } = useAuth();
  return useQuery({
    queryKey: ["affiliate-stats", affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return null;

      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", affiliate.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!affiliate?.id,
    staleTime: 60_000,
  });
}

// ─── Comisiones del afiliado ──────────────────────────────────────────────────

export function useMyCommissions() {
  const { affiliate } = useAuth();
  return useQuery<Commission[]>({
    queryKey: ["commissions", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .eq("is_breakage", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!affiliate?.id,
  });
}

// ─── Billetera / transacciones ────────────────────────────────────────────────

export function useWallet() {
  const { session, affiliate } = useAuth();
  return useQuery<{ balance: number; transactions: CreditTransaction[] }>({
    queryKey: ["wallet", affiliate?.id],
    queryFn: async () => {
      const { data: credit } = await supabase
        .from("user_credits")
        .select("balance, credit_transactions(*)")
        .eq("user_id", session!.user.id)
        .maybeSingle();

      return {
        balance:      credit?.balance ?? 0,
        transactions: (credit?.credit_transactions as CreditTransaction[]) ?? [],
      };
    },
    enabled: !!session && !!affiliate,
  });
}

// ─── Pagos del afiliado (comprobantes enviados) ───────────────────────────────

export function useMyPayments() {
  const { affiliate } = useAuth();
  return useQuery<AffiliatePayment[]>({
    queryKey: ["affiliate-payments", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payments")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!affiliate?.id,
  });
}

// ─── Red del afiliado (directos nivel 1) ─────────────────────────────────────

export function useMyNetwork() {
  const { affiliate } = useAuth();
  return useQuery({
    queryKey: ["network", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("level, referred:referred_id(id, name, affiliate_code, package, account_status, total_sales, created_at)")
        .eq("referrer_id", affiliate!.id)
        .order("level");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!affiliate?.id,
  });
}

// ─── Mutación: subir comprobante de pago ─────────────────────────────────────

interface SubmitPaymentArgs {
  type:                 AffiliatePayment["type"];
  amount:               number;
  receiptFile?:         File;   // opcional: retiros no necesitan comprobante
  packageTo?:           PackageType;
  packageFrom?:         PackageType;
  reactivationMonth?:   string;
  walletCreditAmount?:  number;
  withdrawalMethod?:    string;
  withdrawalAccount?:   string;
}

export function useSubmitPayment() {
  const { affiliate, session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: SubmitPaymentArgs) => {
      // 1. Subir comprobante a Storage (solo si se adjuntó archivo)
      let receiptStorageUrl: string | undefined;
      if (args.receiptFile && args.receiptFile.size > 0) {
        const ext  = args.receiptFile.name.split(".").pop();
        const path = `${session!.user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, args.receiptFile);
        if (uploadError) throw new Error("Error al subir comprobante: " + uploadError.message);
        const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptStorageUrl = publicUrl;
      }

      // 2. Insertar registro de pago
      const { error } = await supabase.from("affiliate_payments").insert({
        affiliate_id:         affiliate!.id,
        type:                 args.type,
        status:               "pendiente",
        amount:               args.amount,
        receipt_url:          receiptStorageUrl ?? null,
        package_to:           args.packageTo,
        package_from:         args.packageFrom,
        reactivation_month:   args.reactivationMonth,
        wallet_credit_amount: args.walletCreditAmount,
        withdrawal_method:    args.withdrawalMethod,
        withdrawal_account:   args.withdrawalAccount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-payments"] });
    },
  });
}

// ─── Configuración de tienda del afiliado ────────────────────────────────────

export function useMyStoreConfig() {
  const { affiliate } = useAuth();
  return useQuery<StoreConfig | null>({
    queryKey: ["store-config", affiliate?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_store_config")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!affiliate?.id,
  });
}

export function useUpdateStoreConfig() {
  const { affiliate } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<Omit<StoreConfig, "id" | "affiliate_id" | "created_at" | "updated_at">>) => {
      const { error } = await supabase
        .from("affiliate_store_config")
        .upsert({
          affiliate_id: affiliate!.id,
          ...config,
        }, { onConflict: "affiliate_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-config"] });
      qc.invalidateQueries({ queryKey: ["store-products"] });
    },
  });
}

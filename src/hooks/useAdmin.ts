import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Affiliate, Order, OrderItem, AffiliatePayment, Commission, Product, BusinessSettings } from "@/lib/database.types";
import { toN } from "@/lib/utils";
// Mapas autoritativos de planes — fuente única de verdad. Evita el bug H-01
// (Ejecutivo ausente) y la divergencia H-06 (depth_unlocked en dos lugares).
import { ACTIVATION_TARGET, PLAN_DEPTH } from "@/lib/activationPrice";

/** Normalize affiliate numeric fields returned as strings by PostgREST */
function normalizeAffiliate<T extends Affiliate>(a: T): T {
  return { ...a, total_sales: toN(a.total_sales), total_commissions: toN(a.total_commissions) };
}

/** Normalize order numeric fields */
function normalizeOrder(o: Order): Order {
  return { ...o, total: toN(o.total) };
}

/** Normalize commission numeric fields */
function normalizeCommission(c: Commission): Commission {
  return { ...c, amount: toN(c.amount), base_amount: toN(c.base_amount), percentage: toN(c.percentage) };
}

/** Normalize payment numeric fields */
function normalizePayment(p: AffiliatePayment): AffiliatePayment {
  return { ...p, amount: toN(p.amount) };
}

// ─── Todos los afiliados ──────────────────────────────────────────────────────

export function useAllAffiliates() {
  return useQuery<(Affiliate & { sponsor: { name: string } | null })[]>({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*, sponsor:referred_by(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as any) ?? []).map(normalizeAffiliate);
    },
    staleTime: 30_000,
  });
}

// ─── Todos los pedidos ────────────────────────────────────────────────────────

export type OrderWithItems = Order & { order_items: OrderItem[] };

export function useAllOrders() {
  return useQuery<OrderWithItems[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as OrderWithItems[]) ?? []).map(o => ({
        ...normalizeOrder(o),
        order_items: (o.order_items ?? []).map((i: OrderItem) => ({
          ...i,
          price:    toN(i.price),
          subtotal: toN((i as any).subtotal),
        })),
      }));
    },
    staleTime: 30_000,
  });
}

// ─── Todos los pagos de afiliados (con info del afiliado) ─────────────────────

export type PaymentWithAffiliate = AffiliatePayment & {
  affiliate: { name: string; affiliate_code: string } | null;
};

export function useAllPayments() {
  return useQuery<PaymentWithAffiliate[]>({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payments")
        .select("*, affiliate:affiliates(name, affiliate_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as PaymentWithAffiliate[]) ?? []).map(p => ({
        ...normalizePayment(p),
        affiliate: p.affiliate,
      }));
    },
    staleTime: 20_000,
  });
}

// ─── Aprobar pago ─────────────────────────────────────────────────────────────

export function useApprovePayment() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.rpc("approve_affiliate_payment", {
        p_payment_id: paymentId,
        p_admin_id:   session!.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    },
  });
}

// ─── Rechazar pago ────────────────────────────────────────────────────────────

export function useRejectPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("affiliate_payments")
        .update({ status: "rechazado" })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });
}

// ─── Comisiones de tipo breakage (remanentes) ─────────────────────────────────

export type BreakageCommission = Commission & {
  affiliate: { name: string; affiliate_code: string } | null;
};

export function useBreakageCommissions() {
  return useQuery<BreakageCommission[]>({
    queryKey: ["admin-breakage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*, affiliate:affiliates!commissions_affiliate_id_fkey(name, affiliate_code)")
        .eq("is_breakage", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as BreakageCommission[]) ?? []).map(c => ({ ...normalizeCommission(c), affiliate: c.affiliate }));
    },
    staleTime: 60_000,
  });
}

// ─── Actualizar estado de un pedido ──────────────────────────────────────────

export function useUpdateOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      // 1. Obtener información de la orden y del afiliado
      const { data: order } = await supabase
        .from("orders")
        .select("affiliate_id, is_activation_order")
        .eq("id", orderId)
        .maybeSingle();

      // 2. Actualizar el estado de la orden
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (updateError) throw updateError;

      // 3. Lógica de activación acumulativa (solo si la orden confirmada es de activación)
      const confirmedStatuses = ["procesando", "enviado", "entregado"];
      if (order?.is_activation_order && order?.affiliate_id && confirmedStatuses.includes(status)) {
        
        // Obtener el paquete elegido por el afiliado
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("account_status, package")
          .eq("id", order.affiliate_id)
          .maybeSingle();

        if (affiliate?.account_status === "pending") {
          // Calcular el total ACUMULADO de órdenes de activación ya confirmadas
          const { data: orders } = await supabase
            .from("orders")
            .select("total")
            .eq("affiliate_id", order.affiliate_id)
            .eq("is_activation_order", true)
            .in("status", confirmedStatuses);

          const totalConfirmed = (orders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

          // FIX H-01 + recomendación 7.1 del audit: usar el mapa autoritativo
          // de activationPrice.ts. Antes había un objeto local que omitía
          // "Ejecutivo" y dejaba esos afiliados sin transición a 'active'.
          const target = ACTIVATION_TARGET[affiliate.package || "Básico"] ?? 120;

          // Si el acumulado confirma el cumplimiento de la meta:
          if (totalConfirmed >= target) {
            await supabase
              .from("affiliates")
              .update({
                account_status: "active",
                activated_at: new Date().toISOString()
              })
              .eq("id", order.affiliate_id);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
      qc.invalidateQueries({ queryKey: ["affiliate"] });
    },
  });
}

// ─── Actualizar afiliado ──────────────────────────────────────────────────────

export function useUpdateAffiliate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, yape_number, pkg }: { id: string; name: string; yape_number: string; pkg: string }) => {
      // FIX H-01 + recomendación 7.1: depth_unlocked se sincroniza con el mapa
      // autoritativo PLAN_DEPTH (incluye Ejecutivo=5). Evita perder niveles de
      // cobro de bonos y comisiones residuales si el admin cambia el paquete.
      const depth_unlocked = PLAN_DEPTH[pkg] ?? 3;
      const { error } = await supabase
        .from("affiliates")
        .update({ name, yape_number, package: pkg, depth_unlocked })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    },
  });
}

// ─── Actualizar producto ──────────────────────────────────────────────────────

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, price, partner_price, public_price, stock, description, image_url, image_alt, gallery_images, is_active, category_id }: {
      id: string; name: string; price: number; partner_price?: number | null; public_price?: number | null;
      stock: number; description: string; image_url?: string; image_alt?: string | null;
      gallery_images?: { url: string; alt: string }[]; is_active?: boolean; category_id?: string | null;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name, price, stock, description,
          ...(partner_price    !== undefined && { partner_price }),
          ...(public_price     !== undefined && { public_price  }),
          ...(image_url        !== undefined && { image_url     }),
          ...(image_alt        !== undefined && { image_alt     }),
          ...(gallery_images   !== undefined && { gallery_images }),
          ...(is_active        !== undefined && { is_active     }),
          ...(category_id      !== undefined && { category_id   }),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Actualizar configuración del negocio ────────────────────────────────────

export function useUpdateBusinessSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: Pick<BusinessSettings, "id" | "yape_number" | "yape_qr_url" | "plin_number" | "account_holder_name" | "bank_name" | "bank_account" | "whatsapp_number" | "contact_phone" | "contact_email">) => {
      const { error } = await supabase
        .from("business_settings")
        .update(fields)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
}

// ─── Crear producto ───────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string; price: number; partner_price?: number | null; public_price?: number | null;
      stock: number; description: string; image_url: string; image_alt?: string | null;
      gallery_images?: { url: string; alt: string }[]; is_active: boolean; category_id?: string | null;
    }) => {
      const { error } = await supabase.from("products").insert({ ...product, organic: true });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Categorías CRUD ──────────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, icon, color }: { name: string; icon?: string | null; color?: string | null }) => {
      const { error } = await supabase.from("categories").insert({ name, icon: icon ?? null, color: color ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, icon, color }: { id: string; name: string; icon?: string | null; color?: string | null }) => {
      const { error } = await supabase.from("categories").update({ name, icon: icon ?? null, color: color ?? null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Desasignar productos de esta categoría antes de borrar
      await supabase.from("products").update({ category_id: null }).eq("category_id", id);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Eliminar afiliado ────────────────────────────────────────────────────────

export function useDeleteAffiliate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (affiliateId: string) => {
      // 1. Intentar el borrado total seguro usando la función RPC
      const { error: rpcError } = await supabase.rpc("admin_delete_user", { p_user_id: affiliateId });
      
      // Si la función SQL aún no está desplegada (Method Not Allowed / Not Found), aplicamos fallback
      if (rpcError) {
        console.warn("Fallo el borrado RPC seguro, aplicando borrado manual de tablas públicas (no liberará el email en Auth):", rpcError);
        
        // Fallback: Borrado manual solo de tablas públicas
        await supabase.from("referrals").delete().or(`referrer_id.eq.${affiliateId},referred_id.eq.${affiliateId}`);
        await supabase.from("affiliate_payments").delete().eq("affiliate_id", affiliateId);
        
        const { error } = await supabase.from("affiliates").delete().eq("id", affiliateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    },
  });
}

// ─── Cambiar estado de cuenta del afiliado ────────────────────────────────────

export function useUpdateAffiliateStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "suspended" | "pending" }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ account_status: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    },
  });
}

// ─── Árbol de referidos de un afiliado (con la info del referido) ─────────────

export type ReferralNode = {
  id: string;
  level: number;
  referred: { id: string; name: string; affiliate_code: string; package: string; account_status: string } | null;
};

export function useAffiliateReferralTree(affiliateId: string | null) {
  return useQuery<ReferralNode[]>({
    queryKey: ["affiliate-referral-tree", affiliateId],
    enabled: !!affiliateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, level, referred_id, referred:affiliates!referrals_referred_id_fkey(id, name, affiliate_code, package, account_status)")
        .eq("referrer_id", affiliateId!)
        .order("level", { ascending: true })
        .order("id");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        level: r.level,
        referred: r.referred ?? null,
      }));
    },
    staleTime: 15_000,
  });
}

// ─── Pagos de un afiliado específico ─────────────────────────────────────────

export function useAffiliatePayments(affiliateId: string | null) {
  return useQuery<AffiliatePayment[]>({
    queryKey: ["affiliate-payments", affiliateId],
    enabled: !!affiliateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payments")
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizePayment);
    },
    staleTime: 15_000,
  });
}

// ─── Comisiones pendientes por pagar — resumen (para KPI Resumen) ─────────────

export function usePendingCommissions() {
  return useQuery<{ total: number; count: number }>({
    queryKey: ["admin-pending-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("amount")
        .eq("is_breakage", false)
        .eq("status", "pending");
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.reduce((s: number, r: any) => s + toN(r.amount), 0),
        count: rows.length,
      };
    },
    staleTime: 30_000,
  });
}

// ─── Total en billeteras — resumen (para KPI Resumen) ────────────────────────

export function useTotalWallets() {
  return useQuery<{ total: number; count: number }>({
    queryKey: ["admin-total-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("balance");
      if (error) throw error;
      const rows = data ?? [];
      return {
        total: rows.reduce((s: number, r: any) => s + toN(r.balance), 0),
        count: rows.length,
      };
    },
    staleTime: 30_000,
  });
}

// ─── Saldos detallados de billeteras (user_credits + user_id join client-side)
// user_credits no tiene FK directa a affiliates — se une por user_id en el componente

export type WalletRow = {
  id: string;
  user_id: string;
  balance: number;
  email: string;
  updated_at: string;
};

export function useAllWallets() {
  return useQuery<WalletRow[]>({
    queryKey: ["admin-all-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("id, user_id, balance, email, updated_at")
        .order("balance", { ascending: false });
      if (error) throw error;
      return ((data as WalletRow[]) ?? []).map(w => ({ ...w, balance: toN(w.balance) }));
    },
    staleTime: 30_000,
  });
}

// ─── Comisiones pendientes detalladas (para tabla Por acreditar) ──────────────
// Usa FK hint explícito porque commissions tiene DOS FKs a affiliates
// (affiliate_id y originator_id), lo que genera ambigüedad en PostgREST

export type PendingCommissionRow = Commission & {
  affiliate: { name: string; affiliate_code: string } | null;
};

export function useAllPendingCommissions() {
  return useQuery<PendingCommissionRow[]>({
    queryKey: ["admin-all-pending-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*, affiliate:affiliates!commissions_affiliate_id_fkey(name, affiliate_code)")
        .eq("is_breakage", false)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as PendingCommissionRow[]) ?? []).map(c => ({ ...normalizeCommission(c), affiliate: c.affiliate }));
    },
    staleTime: 30_000,
  });
}

// ─── Eliminar producto ────────────────────────────────────────────────────────

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        // FK violation (23503) o 409 = producto referenciado en pedidos → desactivar
        if (error.code === "23503" || (error as any).status === 409) {
          const { error: deactivateErr } = await supabase
            .from("products")
            .update({ is_active: false })
            .eq("id", id);
          if (deactivateErr) throw deactivateErr;
          return { deactivated: true };
        }
        throw error;
      }
      return { deactivated: false };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

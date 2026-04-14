import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Affiliate, Order, OrderItem, AffiliatePayment, Commission, Product, BusinessSettings } from "@/lib/database.types";

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
      return (data as any) ?? [];
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
      return (data as OrderWithItems[]) ?? [];
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
      return (data as PaymentWithAffiliate[]) ?? [];
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
        .select("*, affiliate:affiliates(name, affiliate_code)")
        .eq("is_breakage", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as BreakageCommission[]) ?? [];
    },
    staleTime: 60_000,
  });
}

// ─── Actualizar estado de un pedido ──────────────────────────────────────────

export function useUpdateOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar pedidos Y afiliados: el trigger de la DB puede haber cambiado
      // el account_status del afiliado automáticamente al aprobar/entregar.
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
      const { error } = await supabase
        .from("affiliates")
        .update({ name, yape_number, package: pkg })
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
    mutationFn: async ({ id, name, price, stock, description, image_url, is_active, category_id }: {
      id: string; name: string; price: number; stock: number; description: string;
      image_url?: string; is_active?: boolean; category_id?: string | null;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({ name, price, stock, description, ...(image_url !== undefined && { image_url }), ...(is_active !== undefined && { is_active }), ...(category_id !== undefined && { category_id }) })
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
    mutationFn: async (product: { name: string; price: number; stock: number; description: string; image_url: string; is_active: boolean; category_id?: string | null }) => {
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
      // 1. Borrar referrals relacionados
      await supabase.from("referrals").delete().or(`referrer_id.eq.${affiliateId},referred_id.eq.${affiliateId}`);
      // 2. Borrar pagos del afiliado
      await supabase.from("affiliate_payments").delete().eq("affiliate_id", affiliateId);
      // 3. Borrar el afiliado
      const { error } = await supabase.from("affiliates").delete().eq("id", affiliateId);
      if (error) throw error;
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
      return data ?? [];
    },
    staleTime: 15_000,
  });
}

// ─── Eliminar producto ────────────────────────────────────────────────────────

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

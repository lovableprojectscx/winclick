import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Affiliate, Order, OrderItem, AffiliatePayment, Commission, Product, BusinessSettings } from "@/lib/database.types";

// ─── Todos los afiliados ──────────────────────────────────────────────────────

export function useAllAffiliates() {
  return useQuery<Affiliate[]>({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
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
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
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
    mutationFn: async ({ id, name, price, stock, description }: { id: string; name: string; price: number; stock: number; description: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ name, price, stock, description })
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
    mutationFn: async ({ id, ...fields }: Pick<BusinessSettings, "id" | "yape_number" | "plin_number" | "bank_name" | "bank_account" | "whatsapp_number" | "contact_phone" | "contact_email">) => {
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
    mutationFn: async (product: { name: string; price: number; stock: number; description: string; image_url: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").insert({ ...product, organic: true });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

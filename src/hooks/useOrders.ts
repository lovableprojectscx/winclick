import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, OrderItem } from "@/lib/database.types";
import { toN } from "@/lib/utils";

export interface CartItem {
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
}

interface PlaceOrderArgs {
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string;
  customerDni:     string;
  shippingAddress: string;
  shippingCity:    string;
  paymentMethod:   "wallet" | "cash";
  items:           CartItem[];
  affiliateCode?:  string;
  receiptUrl?:     string;
}

// ─── Crear pedido ─────────────────────────────────────────────────────────────

export function usePlaceOrder() {
  const { session, affiliate } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      const total = args.items.reduce((s, i) => s + i.price * i.quantity, 0);

      // 1. Buscar affiliate_id por código si viene referido
      let affiliateId: string | null = affiliate?.id ?? null;
      if (args.affiliateCode && !affiliateId) {
        const { data } = await supabase
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", args.affiliateCode.toUpperCase())
          .maybeSingle();
        affiliateId = data?.id ?? null;
      }

      // 2. Crear el pedido (order_number lo genera el trigger)
      const isActivation = affiliate?.account_status === "pending";

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name:        args.customerName,
          customer_email:       args.customerEmail,
          customer_phone:       args.customerPhone,
          customer_dni:         args.customerDni,
          shipping_address:     args.shippingAddress,
          shipping_city:        args.shippingCity,
          payment_method:       args.paymentMethod,
          total,
          status:               "pendiente",
          affiliate_id:         affiliateId,
          shipping_voucher_url: args.receiptUrl,
          is_activation_order:  isActivation,
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;

      // 3. Descontar billetera DESPUÉS de crear el pedido (nunca antes)
      if (args.paymentMethod === "wallet" && session) {
        const { data: result } = await supabase.rpc("use_credits_for_purchase", {
          p_amount:   total,
          p_order_id: order.id,
        });
        if (!result?.success) {
          // Revertir el pedido si falla el pago
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error(result?.error ?? "Saldo insuficiente");
        }
      }

      // 4. Insertar comprobante de pago
      if (args.receiptUrl) {
        const { error: proofError } = await supabase.from("payment_proofs").insert({
          order_id:       order.id,
          proof_url:      args.receiptUrl,
          payment_method: args.paymentMethod,
          amount:         total,
          status:         "pendiente",
        });
        if (proofError) throw new Error("Error al guardar el comprobante: " + proofError.message);
      }

      // 5. Insertar items
      const itemsToInsert = args.items.map(i => ({
        order_id:   order.id,
        product_id: i.productId,
        name:       i.name,
        price:      i.price,
        quantity:   i.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Las comisiones se calculan automáticamente via trigger DB
      // cuando el pedido alcanza el estado 'entregado' (trigger_commissions_on_delivery)

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["affiliate-stats"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ─── Pedidos del afiliado ─────────────────────────────────────────────────────

export function useMyOrders() {
  const { affiliate } = useAuth();
  return useQuery<(Order & { order_items: OrderItem[] })[]>({
    queryKey: ["orders", affiliate?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as (Order & { order_items: OrderItem[] })[]) ?? []).map(o => ({
        ...o,
        total:       toN(o.total),
        order_items: (o.order_items ?? []).map(i => ({ ...i, price: toN(i.price), subtotal: toN((i as any).subtotal) })),
      }));
    },
    enabled: !!affiliate?.id,
  });
}

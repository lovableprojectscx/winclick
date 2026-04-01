import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, OrderItem } from "@/lib/database.types";

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
}

// ─── Crear pedido ─────────────────────────────────────────────────────────────

export function usePlaceOrder() {
  const { session, affiliate } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: PlaceOrderArgs) => {
      const total = args.items.reduce((s, i) => s + i.price * i.quantity, 0);

      // 1. Si paga con billetera, descontar crédito primero
      if (args.paymentMethod === "wallet" && session) {
        const { data: result } = await supabase.rpc("use_credits_for_purchase", {
          p_user_id: session.user.id,
          p_amount:  total,
        });
        if (!result?.success) throw new Error(result?.error ?? "Saldo insuficiente");
      }

      // 2. Buscar affiliate_id por código si viene referido
      let affiliateId: string | null = affiliate?.id ?? null;
      if (args.affiliateCode && !affiliateId) {
        const { data } = await supabase
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", args.affiliateCode.toUpperCase())
          .single();
        affiliateId = data?.id ?? null;
      }

      // 3. Crear el pedido (order_number lo genera el trigger)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name:    args.customerName,
          customer_email:   args.customerEmail,
          customer_phone:   args.customerPhone,
          customer_dni:     args.customerDni,
          shipping_address: args.shippingAddress,
          shipping_city:    args.shippingCity,
          payment_method:   args.paymentMethod,
          total,
          status:           "pendiente",
          affiliate_id:     affiliateId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Insertar items
      const itemsToInsert = args.items.map(i => ({
        order_id:   order.id,
        product_id: i.productId,
        name:       i.name,
        price:      i.price,
        quantity:   i.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 5. Calcular comisiones si hay afiliado
      if (affiliateId && args.affiliateCode) {
        await supabase.rpc("create_order_commissions", {
          p_order_id:      order.id,
          p_order_amount:  total,
          p_affiliate_code: args.affiliateCode.toUpperCase(),
        });
      }

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["affiliate-stats"] });
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
      return (data as (Order & { order_items: OrderItem[] })[]) ?? [];
    },
    enabled: !!affiliate?.id,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/lib/database.types";

// ─── Productos ────────────────────────────────────────────────────────────────

export function useProducts(categoryId?: string, includeInactive = false) {
  return useQuery<Product[]>({
    queryKey: ["products", categoryId, includeInactive],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("name");
      if (categoryId) q = q.eq("category_id", categoryId);
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Productos de una tienda de afiliado ─────────────────────────────────────

export function useStoreProducts(affiliateCode: string) {
  return useQuery<{ store: import("@/lib/database.types").StoreConfig | null; products: Product[] }>({
    queryKey: ["store", affiliateCode],
    queryFn: async () => {
      // Buscar config de la tienda por código de afiliado
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("affiliate_code", affiliateCode.toUpperCase())
        .single();

      if (!affiliate) return { store: null, products: [] };

      const { data: store } = await supabase
        .from("affiliate_store_config")
        .select("*")
        .eq("affiliate_id", affiliate.id)
        .single();

      if (!store?.is_public) return { store, products: [] };

      // Productos destacados de la tienda
      const ids = store.featured_product_ids ?? [];
      if (ids.length === 0) {
        // Si no hay destacados, mostrar todos los productos
        if (store.show_all_products) {
          const { data } = await supabase.from("products").select("*").order("name");
          return { store, products: data ?? [] };
        }
        return { store, products: [] };
      }

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);

      return { store, products: products ?? [] };
    },
    enabled: !!affiliateCode,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useFavorites() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", session.user.id);
      
      if (error) throw error;
      return data.map(f => f.product_id);
    },
    enabled: !!session?.user?.id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ productId, isFavorited }: { productId: string; isFavorited: boolean }) => {
      if (!session?.user?.id) throw new Error("Debes iniciar sesión para agregar a favoritos");

      if (isFavorited) {
        // Eliminar
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("product_id", productId);
        if (error) throw error;
        return { productId, action: "removed" };
      } else {
        // Agregar
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: session.user.id, product_id: productId });
        if (error) throw error;
        return { productId, action: "added" };
      }
    },
    onMutate: async ({ productId, isFavorited }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ["favorites", session?.user?.id] });
      const previous = qc.getQueryData<string[]>(["favorites", session?.user?.id]) || [];
      
      qc.setQueryData<string[]>(["favorites", session?.user?.id], old => {
        if (!old) return [];
        return isFavorited ? old.filter(id => id !== productId) : [...old, productId];
      });
      return { previous };
    },
    onError: (err, _, context: any) => {
      qc.setQueryData(["favorites", session?.user?.id], context?.previous);
      toast({ title: "Error en favoritos", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favorites", session?.user?.id] });
    }
  });

  return { favoriteIds, toggleFavorite, isLoading };
}

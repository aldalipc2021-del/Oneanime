import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AnimeRating {
  id: string;
  anime_id: number;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Get average rating for an anime
export const useAnimeAverageRating = (animeId: number) => {
  return useQuery({
    queryKey: ["animeAverageRating", animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime_ratings")
        .select("rating")
        .eq("anime_id", animeId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }
      
      const sum = data.reduce((acc, r) => acc + Number(r.rating), 0);
      return {
        average: sum / data.length,
        count: data.length,
      };
    },
    enabled: !!animeId,
  });
};

// Get user's rating for an anime
export const useUserAnimeRating = (animeId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userAnimeRating", animeId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("anime_ratings")
        .select("*")
        .eq("anime_id", animeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as AnimeRating | null;
    },
    enabled: !!user && !!animeId,
  });
};

// Add or update rating
export const useSetAnimeRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      rating,
    }: {
      animeId: number;
      rating: number;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { data, error } = await supabase
        .from("anime_ratings")
        .upsert(
          {
            user_id: user.id,
            anime_id: animeId,
            rating,
          },
          {
            onConflict: "anime_id,user_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["animeAverageRating", variables.animeId] });
      queryClient.invalidateQueries({ queryKey: ["userAnimeRating", variables.animeId] });
    },
  });
};

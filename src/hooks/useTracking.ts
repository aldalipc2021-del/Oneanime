import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TrackingStatus = "watching" | "completed" | "plan_to_watch";

export interface TrackedAnime {
  id: string;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string | null;
  current_episode: number;
  total_episodes: number | null;
  status: TrackingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTrackedAnime = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trackedAnime", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("anime_tracking")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as TrackedAnime[];
    },
    enabled: !!user,
  });
};

export const useTrackingStatus = (animeId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trackingStatus", animeId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("anime_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .maybeSingle();

      if (error) throw error;
      return data as TrackedAnime | null;
    },
    enabled: !!user && !!animeId,
  });
};

export const useAddTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      animeTitle,
      animeImage,
      totalEpisodes,
      status,
    }: {
      animeId: number;
      animeTitle: string;
      animeImage?: string;
      totalEpisodes?: number;
      status: TrackingStatus;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { data, error } = await supabase
        .from("anime_tracking")
        .upsert(
          {
            user_id: user.id,
            anime_id: animeId,
            anime_title: animeTitle,
            anime_image: animeImage || null,
            total_episodes: totalEpisodes || null,
            status,
            current_episode: status === "completed" ? (totalEpisodes || 0) : 0,
          },
          {
            onConflict: "user_id,anime_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trackedAnime"] });
      queryClient.invalidateQueries({ queryKey: ["trackingStatus", variables.animeId] });
    },
  });
};

export const useUpdateTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      updates,
    }: {
      animeId: number;
      updates: Partial<Pick<TrackedAnime, "status" | "current_episode" | "notes">>;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { data, error } = await supabase
        .from("anime_tracking")
        .update(updates)
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trackedAnime"] });
      queryClient.invalidateQueries({ queryKey: ["trackingStatus", variables.animeId] });
    },
  });
};

export const useRemoveTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animeId: number) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { error } = await supabase
        .from("anime_tracking")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", animeId);

      if (error) throw error;
    },
    onSuccess: (_, animeId) => {
      queryClient.invalidateQueries({ queryKey: ["trackedAnime"] });
      queryClient.invalidateQueries({ queryKey: ["trackingStatus", animeId] });
    },
  });
};

export const useMarkSeasonWatched = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      totalEpisodes,
    }: {
      animeId: number;
      totalEpisodes: number;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { data, error } = await supabase
        .from("anime_tracking")
        .update({
          current_episode: totalEpisodes,
          status: "completed",
        })
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trackedAnime"] });
      queryClient.invalidateQueries({ queryKey: ["trackingStatus", variables.animeId] });
    },
  });
};

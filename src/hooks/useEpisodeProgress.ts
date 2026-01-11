import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface EpisodeProgress {
  id: string;
  user_id: string;
  anime_id: number;
  season_id: number;
  episode_number: number;
  watched: boolean;
  watched_at: string | null;
}

export const useEpisodeProgress = (animeId: number, seasonId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["episodeProgress", animeId, seasonId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("episode_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .eq("season_id", seasonId);

      if (error) throw error;
      return data as EpisodeProgress[];
    },
    enabled: !!user && !!animeId && !!seasonId,
  });
};

export const useAllEpisodeProgress = (animeId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["allEpisodeProgress", animeId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("episode_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("anime_id", animeId);

      if (error) throw error;
      return data as EpisodeProgress[];
    },
    enabled: !!user && !!animeId,
  });
};

export const useToggleEpisodeProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      animeId,
      seasonId,
      episodeNumber,
      watched,
    }: {
      animeId: number;
      seasonId: number;
      episodeNumber: number;
      watched: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (watched) {
        // Insert or update as watched
        const { error } = await supabase.from("episode_progress").upsert(
          {
            user_id: user.id,
            anime_id: animeId,
            season_id: seasonId,
            episode_number: episodeNumber,
            watched: true,
            watched_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,anime_id,season_id,episode_number",
          }
        );
        if (error) throw error;
      } else {
        // Delete progress record
        const { error } = await supabase
          .from("episode_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("anime_id", animeId)
          .eq("season_id", seasonId)
          .eq("episode_number", episodeNumber);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["episodeProgress", variables.animeId, variables.seasonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["allEpisodeProgress", variables.animeId],
      });
    },
  });
};

export const useMarkAllEpisodesWatched = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      animeId,
      seasonId,
      episodeCount,
    }: {
      animeId: number;
      seasonId: number;
      episodeCount: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const progressRecords = [];
      for (let i = 1; i <= episodeCount; i++) {
        progressRecords.push({
          user_id: user.id,
          anime_id: animeId,
          season_id: seasonId,
          episode_number: i,
          watched: true,
          watched_at: new Date().toISOString(),
        });
      }

      const { error } = await supabase
        .from("episode_progress")
        .upsert(progressRecords, {
          onConflict: "user_id,anime_id,season_id,episode_number",
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["episodeProgress", variables.animeId, variables.seasonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["allEpisodeProgress", variables.animeId],
      });
    },
  });
};

export const useMarkAllEpisodesUnwatched = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      animeId,
      seasonId,
    }: {
      animeId: number;
      seasonId: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("episode_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .eq("season_id", seasonId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["episodeProgress", variables.animeId, variables.seasonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["allEpisodeProgress", variables.animeId],
      });
    },
  });
};

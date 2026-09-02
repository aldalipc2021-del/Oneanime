import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface EpisodeProgress {
  id: string;
  user_id: string;
  anime_id: number;
  /** UUID of the season row in `seasons` */
  season_id: string;
  episode_number: number;
  watched: boolean;
  watched_at: string | null;
}

/** Progress of a single season */
export const useEpisodeProgress = (animeId: number, seasonId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["episodeProgress", animeId, seasonId, user?.id],
    queryFn: async () => {
      if (!user || !seasonId) return [];

      const { data, error } = await supabase
        .from("episode_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("season_id", seasonId);

      if (error) throw error;
      return (data || []) as EpisodeProgress[];
    },
    enabled: !!user && !!animeId && !!seasonId,
  });
};

/** Progress across all seasons of one anime */
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
      return (data || []) as EpisodeProgress[];
    },
    enabled: !!user && !!animeId,
  });
};

const invalidate = (
  queryClient: ReturnType<typeof useQueryClient>,
  animeId: number,
) => {
  queryClient.invalidateQueries({ queryKey: ["episodeProgress", animeId] });
  queryClient.invalidateQueries({ queryKey: ["allEpisodeProgress", animeId] });
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
      seasonId: string;
      episodeNumber: number;
      watched: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (watched) {
        const { error } = await supabase.from("episode_progress").upsert(
          {
            user_id: user.id,
            anime_id: animeId,
            season_id: seasonId,
            episode_number: episodeNumber,
            watched: true,
            watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,season_id,episode_number" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("episode_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("season_id", seasonId)
          .eq("episode_number", episodeNumber);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => invalidate(queryClient, variables.animeId),
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
      seasonId: string;
      episodeCount: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();
      const rows = Array.from({ length: episodeCount }, (_, i) => ({
        user_id: user.id,
        anime_id: animeId,
        season_id: seasonId,
        episode_number: i + 1,
        watched: true,
        watched_at: now,
      }));

      if (rows.length === 0) return;

      const { error } = await supabase
        .from("episode_progress")
        .upsert(rows, { onConflict: "user_id,season_id,episode_number" });

      if (error) throw error;
    },
    onSuccess: (_, variables) => invalidate(queryClient, variables.animeId),
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
      seasonId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("episode_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("season_id", seasonId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => invalidate(queryClient, variables.animeId),
  });
};

/**
 * One-time migration of episode ticks that were previously kept in the browser
 * only (`watchedEpisodes_<animeId>`, entries look like `s1e4`). Runs once per
 * anime as soon as the seasons are known, then removes the local entry.
 */
export const useMigrateLocalEpisodeProgress = (
  animeId: number,
  seasons: { id: string; season_number: number }[] | undefined,
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const done = useRef<string | null>(null);

  useEffect(() => {
    const key = `watchedEpisodes_${animeId}`;
    if (!user || !animeId || !seasons || seasons.length === 0) return;
    if (done.current === key) return;

    const raw = localStorage.getItem(key);
    if (!raw) return;
    done.current = key;

    const run = async () => {
      let entries: string[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) entries = parsed.map(String);
      } catch {
        localStorage.removeItem(key);
        return;
      }

      const now = new Date().toISOString();
      const rows = entries
        .map((entry) => {
          const match = /^s(\d+)e(\d+)$/.exec(entry);
          // legacy plain numbers belong to the first season
          const seasonNumber = match ? parseInt(match[1], 10) : seasons[0].season_number;
          const episodeNumber = match ? parseInt(match[2], 10) : parseInt(entry, 10);
          const season =
            seasons.find((s) => s.season_number === seasonNumber) ?? seasons[0];
          if (!season || !episodeNumber || Number.isNaN(episodeNumber)) return null;
          return {
            user_id: user.id,
            anime_id: animeId,
            season_id: season.id,
            episode_number: episodeNumber,
            watched: true,
            watched_at: now,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (rows.length > 0) {
        const { error } = await supabase
          .from("episode_progress")
          .upsert(rows, { onConflict: "user_id,season_id,episode_number" });
        if (error) {
          done.current = null;
          return;
        }
        invalidate(queryClient, animeId);
      }

      localStorage.removeItem(key);
    };

    run();
  }, [animeId, seasons, user, queryClient]);
};

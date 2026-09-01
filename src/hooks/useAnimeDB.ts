import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DBSeries {
  id: string;
  anilist_id: number;
  title: string;
  title_en: string | null;
  title_jp: string | null;
  cover_image: string | null;
  description: string | null;
  genres: string[] | null;
  status: string | null;
  format?: string | null;
  year?: number | null;
  episode_count?: number | null;
  popularity?: number | null;
  detail_synced_at?: string | null;
}

export interface DBSeason {
  id: string;
  series_id: string;
  season_number: number;
  anilist_id: number;
  title: string | null;
  episode_count: number | null;
  aired_from: string | null;
  aired_to: string | null;
  cover_image: string | null;
  trailer_url: string | null;
  status: string | null;
}

export interface DBEpisode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string | null;
  title_jp: string | null;
  synopsis: string | null;
  air_date: string | null;
  duration_minutes: number | null;
  thumbnail: string | null;
}

// Map DB status to display status
const mapStatus = (status: string | null): string => {
  switch (status) {
    case "releasing": return "Currently Airing";
    case "finished": return "Finished Airing";
    case "not_yet_released": return "Not yet aired";
    case "cancelled": return "Cancelled";
    case "hiatus": return "On Hiatus";
    default: return status || "Unknown";
  }
};

// Convert DB series to the Anime-like format used by AnimeCard
export const seriesToAnimeCard = (s: DBSeries) => ({
  id: s.anilist_id,
  title: s.title_en || s.title,
  image: s.cover_image || "/placeholder.svg",
  score: undefined as number | undefined,
  episodes: undefined as number | undefined,
  status: mapStatus(s.status),
  genres: s.genres || [],
});

// Fetch all series for the home page
export const useAllSeries = (filter?: string) => {
  return useQuery({
    queryKey: ["dbSeries", filter],
    queryFn: async () => {
      let query = supabase.from("series").select("*");
      
      if (filter === "airing") {
        query = query.eq("status", "releasing");
      } else if (filter === "upcoming") {
        query = query.eq("status", "not_yet_released");
      } else if (filter === "finished") {
        query = query.eq("status", "finished");
      }
      
      const { data, error } = await query
        .order("popularity", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return data as DBSeries[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Search series by title or genre
export const useSearchSeries = (searchQuery?: string, genre?: string, status?: string) => {
  return useQuery({
    queryKey: ["dbSearchSeries", searchQuery, genre, status],
    queryFn: async () => {
      let query = supabase.from("series").select("*");
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%,title_jp.ilike.%${searchQuery}%`);
      }
      if (genre) {
        query = query.contains("genres", [genre]);
      }
      if (status === "airing") query = query.eq("status", "releasing");
      else if (status === "complete") query = query.eq("status", "finished");
      else if (status === "upcoming") query = query.eq("status", "not_yet_released");
      
      const { data, error } = await query
        .order("popularity", { ascending: false, nullsFirst: false })
        .limit(60);
      if (error) throw error;
      return data as DBSeries[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!(searchQuery || genre || status),
  });
};

// Fetch a single series by anilist_id
export const useSeriesByAnilistId = (anilistId: number) => {
  return useQuery({
    queryKey: ["dbSeriesById", anilistId],
    queryFn: async () => {
      // First try finding a series where this is the main anilist_id
      const { data: series } = await supabase
        .from("series")
        .select("*")
        .eq("anilist_id", anilistId)
        .maybeSingle();
      
      if (series) return series as DBSeries;
      
      // Otherwise find the series via a season with this anilist_id
      const { data: season } = await supabase
        .from("seasons")
        .select("series_id")
        .eq("anilist_id", anilistId)
        .maybeSingle();
      
      if (season) {
        const { data: s } = await supabase
          .from("series")
          .select("*")
          .eq("id", season.series_id)
          .single();
        return s as DBSeries;
      }
      
      return null;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!anilistId,
  });
};

// Fetch seasons for a series
export const useDBSeasons = (seriesId: string | undefined) => {
  return useQuery({
    queryKey: ["dbSeasons", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("series_id", seriesId!)
        .order("season_number", { ascending: true });
      if (error) throw error;
      return data as DBSeason[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!seriesId,
  });
};

// Fetch episodes for a season
export const useDBEpisodes = (seasonId: string | undefined) => {
  return useQuery({
    queryKey: ["dbEpisodes", seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("season_id", seasonId!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data as DBEpisode[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!seasonId,
  });
};

// Get all unique genres from DB
export const useDBGenres = () => {
  return useQuery({
    queryKey: ["dbGenres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("genres");
      if (error) throw error;
      const genreSet = new Set<string>();
      (data || []).forEach((s: any) => {
        (s.genres || []).forEach((g: string) => genreSet.add(g));
      });
      return Array.from(genreSet).sort().map((name, i) => ({ mal_id: i, name }));
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Get display title
export const getDisplayTitle = (item: { title_en?: string | null; title?: string; title_english?: string | null }) => {
  return item.title_en || item.title_english || item.title || "";
};

// On-demand detail sync: catalog entries have no seasons/episodes yet.
// When a detail page is opened without seasons, trigger the backend sync once.
export const useEnsureDetailSync = (
  anilistId: number | undefined,
  seriesId: string | undefined,
  hasSeasons: boolean,
  ready: boolean,
) => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [failed, setFailed] = useState(false);
  const attempted = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!ready || !anilistId || hasSeasons) return;
    if (attempted.current.has(anilistId)) return;
    attempted.current.add(anilistId);

    let cancelled = false;
    setIsSyncing(true);
    setFailed(false);

    supabase.functions
      .invoke("sync-anime", { body: { anilist_id: anilistId } })
      .then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setFailed(true);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["dbSeriesById", anilistId] });
        queryClient.invalidateQueries({ queryKey: ["dbSeasons"] });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [anilistId, seriesId, hasSeasons, ready, queryClient]);

  return { isSyncing, failed };
};


// Total number of series in the catalog
export const useSeriesCount = () => {
  return useQuery({
    queryKey: ["dbSeriesCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("series")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30 * 60 * 1000,
  });
};

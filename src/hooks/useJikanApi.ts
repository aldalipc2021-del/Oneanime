import { useQuery } from "@tanstack/react-query";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Rate limiting helper - Jikan has rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  score: number;
  scored_by: number;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: {
    from: string;
    to: string;
    string: string;
  };
  duration: string;
  rating: string;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  source: string;
  type: string;
  year: number;
  season: string;
  trailer: {
    youtube_id: string;
    url: string;
  };
  relations?: {
    relation: string;
    entry: {
      mal_id: number;
      type: string;
      name: string;
    }[];
  }[];
}

export interface Episode {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired: string;
  score: number;
  filler: boolean;
  recap: boolean;
}

export interface AnimeSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  rating?: string;
  genres?: string;
  order_by?: string;
  sort?: string;
}

// Fetch top anime
export const useTopAnime = (filter: string = "airing", page: number = 1) => {
  return useQuery({
    queryKey: ["topAnime", filter, page],
    queryFn: async () => {
      const response = await fetch(
        `${JIKAN_BASE_URL}/top/anime?filter=${filter}&page=${page}&limit=24`
      );
      if (!response.ok) throw new Error("Failed to fetch top anime");
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch seasonal anime
export const useSeasonalAnime = (year?: number, season?: string) => {
  const currentDate = new Date();
  const currentYear = year || currentDate.getFullYear();
  const seasons = ["winter", "spring", "summer", "fall"];
  const currentSeason = season || seasons[Math.floor(currentDate.getMonth() / 3)];

  return useQuery({
    queryKey: ["seasonalAnime", currentYear, currentSeason],
    queryFn: async () => {
      const response = await fetch(
        `${JIKAN_BASE_URL}/seasons/${currentYear}/${currentSeason}?limit=24`
      );
      if (!response.ok) throw new Error("Failed to fetch seasonal anime");
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch anime by ID
export const useAnimeById = (id: number) => {
  return useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}/full`);
      if (!response.ok) throw new Error("Failed to fetch anime");
      const data = await response.json();
      return data.data as Anime;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

// Fetch anime episodes
export const useAnimeEpisodes = (id: number, page: number = 1) => {
  return useQuery({
    queryKey: ["animeEpisodes", id, page],
    queryFn: async () => {
      const response = await fetch(
        `${JIKAN_BASE_URL}/anime/${id}/episodes?page=${page}`
      );
      if (!response.ok) throw new Error("Failed to fetch episodes");
      const data = await response.json();
      return data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

// Search anime
export const useSearchAnime = (params: AnimeSearchParams) => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== "")
      .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})
  ).toString();

  return useQuery({
    queryKey: ["searchAnime", queryString],
    queryFn: async () => {
      const response = await fetch(`${JIKAN_BASE_URL}/anime?${queryString}&sfw=true`);
      if (!response.ok) throw new Error("Failed to search anime");
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!params.q || !!params.genres || !!params.status,
  });
};

// Fetch anime recommendations
export const useAnimeRecommendations = (id: number) => {
  return useQuery({
    queryKey: ["animeRecommendations", id],
    queryFn: async () => {
      const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      return data.data?.slice(0, 12) || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!id,
  });
};

// Fetch genres list
export const useGenres = () => {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const response = await fetch(`${JIKAN_BASE_URL}/genres/anime`);
      if (!response.ok) throw new Error("Failed to fetch genres");
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Fetch current season anime (schedule)
export const useSchedule = (day?: string) => {
  return useQuery({
    queryKey: ["schedule", day],
    queryFn: async () => {
      const url = day
        ? `${JIKAN_BASE_URL}/schedules?filter=${day}`
        : `${JIKAN_BASE_URL}/schedules`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch schedule");
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Get display title (prefer German/English over Japanese)
export const getDisplayTitle = (anime: Anime | { title: string; title_english?: string | null }) => {
  return anime.title_english || anime.title;
};

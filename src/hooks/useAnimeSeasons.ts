import { useQuery } from "@tanstack/react-query";
import { fetchAniListMediaByMalId, fetchAniListMediaById, mapAniListToAnime, type AniListMedia } from "./useAniListApi";

export interface SeasonEntry {
  mal_id: number;
  anilist_id: number;
  title: string;
  title_english: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  episodes: number | null;
  aired: { from: string; to: string; string: string };
  season: string;
  year: number;
  type: string;
  isFilm?: boolean;
  synopsis?: string;
  watchAfterSeason?: number;
}

// Map AniList media to SeasonEntry
const mapToSeasonEntry = (media: AniListMedia): SeasonEntry => {
  const anime = mapAniListToAnime(media);
  return {
    mal_id: media.id, // Use AniList ID consistently
    anilist_id: media.id,
    title: anime.title,
    title_english: anime.title_english,
    images: anime.images,
    episodes: anime.episodes,
    aired: anime.aired,
    season: anime.season,
    year: anime.year,
    type: anime.type,
    synopsis: anime.synopsis,
  };
};

// Traverse AniList relations to find all seasons using BFS
const collectRelatedAnime = (startMedia: AniListMedia): { seasons: SeasonEntry[]; films: SeasonEntry[] } => {
  const visited = new Set<number>();
  const queue: AniListMedia[] = [startMedia];
  const allSeasons: SeasonEntry[] = [];
  const allFilms: SeasonEntry[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const format = current.format;
    const entry = mapToSeasonEntry(current);

    if (format === "TV" || format === "ONA" || format === "TV_SHORT") {
      allSeasons.push(entry);
    } else if (format === "MOVIE") {
      entry.isFilm = true;
      allFilms.push(entry);
    } else if (format === "SPECIAL" || format === "OVA") {
      entry.isFilm = true;
      allFilms.push(entry);
    }

    // Traverse relations
    if (current.relations?.edges) {
      for (const edge of current.relations.edges) {
        const validRelations = ["SEQUEL", "PREQUEL", "SIDE_STORY", "PARENT", "ALTERNATIVE", "SUMMARY"];
        if (validRelations.includes(edge.relationType) && edge.node && !visited.has(edge.node.id)) {
          queue.push(edge.node);
        }
      }
    }
  }

  // Sort by start date
  const sortByDate = (a: SeasonEntry, b: SeasonEntry) => {
    const dateA = a.aired?.from ? new Date(a.aired.from).getTime() : 0;
    const dateB = b.aired?.from ? new Date(b.aired.from).getTime() : 0;
    return dateA - dateB;
  };

  allSeasons.sort(sortByDate);
  allFilms.sort(sortByDate);

  // Calculate watch order for films
  for (const film of allFilms) {
    const filmDate = film.aired?.from ? new Date(film.aired.from) : null;
    if (filmDate) {
      for (let i = allSeasons.length - 1; i >= 0; i--) {
        const seasonEnd = allSeasons[i].aired?.to ? new Date(allSeasons[i].aired.to) : null;
        if (seasonEnd && filmDate > seasonEnd) {
          film.watchAfterSeason = i + 1;
          break;
        }
      }
    }
  }

  return { seasons: allSeasons, films: allFilms };
};

// Main hook: fetches anime and traverses its relations for seasons
export const useAnimeSeasons = (animeId: number, includeFilmsAsSeason: boolean = false) => {
  return useQuery({
    queryKey: ["animeSeasons", animeId, includeFilmsAsSeason],
    queryFn: async () => {
      // Try AniList ID first, then MAL ID
      let media = await fetchAniListMediaById(animeId);
      if (!media) media = await fetchAniListMediaByMalId(animeId);
      if (!media) return { seasons: [], films: [] };
      return collectRelatedAnime(media);
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!animeId,
  });
};

// Episode fetching still uses Jikan (AniList doesn't have episode titles)
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

const fetchJikanEpisodes = async (animeId: number, page: number = 1): Promise<any> => {
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${animeId}/episodes?page=${page}`);
    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retry = await fetch(`${JIKAN_BASE_URL}/anime/${animeId}/episodes?page=${page}`);
      if (!retry.ok) return { data: [], pagination: { has_next_page: false } };
      return await retry.json();
    }
    if (!response.ok) return { data: [], pagination: { has_next_page: false } };
    return await response.json();
  } catch {
    return { data: [], pagination: { has_next_page: false } };
  }
};

export const useAllAnimeEpisodes = (animeId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["allAnimeEpisodes", animeId],
    queryFn: async () => {
      const allEpisodes: any[] = [];
      let page = 1;
      let hasNextPage = true;
      let errors = 0;

      while (hasNextPage && page <= 50 && errors < 3) {
        try {
          const data = await fetchJikanEpisodes(animeId, page);
          const episodes = data.data || [];

          if (episodes.length === 0 && page === 1) {
            // Try to get episode count from AniList and create placeholders
            const media = await fetchAniListMediaByMalId(animeId);
            if (media?.episodes) {
              for (let i = 1; i <= media.episodes; i++) {
                allEpisodes.push({
                  mal_id: i,
                  title: `Episode ${i}`,
                  title_japanese: null,
                  title_romanji: null,
                  aired: null,
                  filler: false,
                  recap: false,
                });
              }
            }
            break;
          }

          if (episodes.length === 0) break;

          errors = 0;
          allEpisodes.push(...episodes);
          hasNextPage = data.pagination?.has_next_page || false;
          page++;

          // Rate limit for Jikan
          if (hasNextPage) await new Promise(resolve => setTimeout(resolve, 400));
        } catch {
          errors++;
          if (errors >= 3) break;
        }
      }

      return allEpisodes;
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!animeId && enabled,
    retry: 2,
    retryDelay: 1000,
  });
};

export const calculateTotalEpisodes = (seasons: SeasonEntry[]): number => {
  return seasons.reduce((total, season) => total + (season.episodes || 0), 0);
};

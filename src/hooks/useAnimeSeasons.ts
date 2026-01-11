import { useQuery } from "@tanstack/react-query";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export interface SeasonEntry {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_german?: string | null;
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
  watchAfterEpisode?: number;
  watchAfterSeason?: number;
}

interface RelationEntry {
  mal_id: number;
  type: string;
  name: string;
}

interface AnimeRelation {
  relation: string;
  entry: RelationEntry[];
}

// Rate limiter to respect Jikan API limits (3 requests per second, 60 per minute)
class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private minuteStart = Date.now();

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset minute counter if a minute has passed
      if (now - this.minuteStart > 60000) {
        this.minuteStart = now;
        this.requestCount = 0;
      }

      // Wait if we've hit the per-minute limit
      if (this.requestCount >= 55) {
        const waitTime = 60000 - (now - this.minuteStart) + 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.minuteStart = Date.now();
        this.requestCount = 0;
      }

      // Wait at least 350ms between requests (slightly under 3/sec limit)
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < 350) {
        await new Promise(resolve => setTimeout(resolve, 350 - timeSinceLastRequest));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        this.requestCount++;
        await task();
      }
    }

    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Helper to fetch anime details with rate limiting
const fetchAnimeDetails = async (id: number, retries = 3): Promise<any | null> => {
  return rateLimiter.add(async () => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}/full`);
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
      } catch (error) {
        if (attempt === retries - 1) return null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  });
};

// Fetch episodes for an anime with German titles if available
const fetchAnimeEpisodes = async (animeId: number, page: number = 1): Promise<any> => {
  return rateLimiter.add(async () => {
    try {
      const response = await fetch(
        `${JIKAN_BASE_URL}/anime/${animeId}/episodes?page=${page}`
      );
      
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResponse = await fetch(
          `${JIKAN_BASE_URL}/anime/${animeId}/episodes?page=${page}`
        );
        if (!retryResponse.ok) return { data: [], pagination: { has_next_page: false } };
        return await retryResponse.json();
      }
      
      if (!response.ok) return { data: [], pagination: { has_next_page: false } };
      return await response.json();
    } catch (error) {
      console.error("Error fetching episodes:", error);
      return { data: [], pagination: { has_next_page: false } };
    }
  });
};

// Fetch all related anime (seasons) by traversing relations using improved BFS
export const useAnimeSeasons = (animeId: number, includeFilmsAsSeason: boolean = false) => {
  return useQuery({
    queryKey: ["animeSeasons", animeId, includeFilmsAsSeason],
    queryFn: async () => {
      const allSeasons: SeasonEntry[] = [];
      const allFilms: SeasonEntry[] = [];
      const visited = new Set<number>();
      const queue: number[] = [animeId];
      const animeDataCache = new Map<number, any>();
      
      // Phase 1: Collect all anime IDs first using BFS
      const allIds: number[] = [];
      const tempVisited = new Set<number>();
      const tempQueue = [...queue];
      
      // First pass - just collect IDs without fetching all details
      while (tempQueue.length > 0 && tempVisited.size < 50) {
        const currentId = tempQueue.shift()!;
        if (tempVisited.has(currentId)) continue;
        tempVisited.add(currentId);
        allIds.push(currentId);

        const anime = await fetchAnimeDetails(currentId);
        if (!anime) continue;
        
        animeDataCache.set(currentId, anime);

        // Find all related anime
        const relations: AnimeRelation[] = anime.relations || [];
        for (const relation of relations) {
          // Include more relation types to catch all seasons
          const validRelations = [
            "Sequel", 
            "Prequel", 
            "Side story", 
            "Parent story",
            "Alternative version",
            "Alternative setting",
            "Full story",
            "Summary"
          ];
          
          if (validRelations.includes(relation.relation)) {
            for (const entry of relation.entry) {
              if (entry.type === "anime" && !tempVisited.has(entry.mal_id)) {
                tempQueue.push(entry.mal_id);
              }
            }
          }
        }
      }

      // Phase 2: Categorize all found anime
      for (const id of allIds) {
        if (visited.has(id)) continue;
        visited.add(id);

        let anime = animeDataCache.get(id);
        if (!anime) {
          anime = await fetchAnimeDetails(id);
          if (!anime) continue;
        }

        // Check if it's a proper season or a film
        const isTVOrONA = anime.type === "TV" || anime.type === "ONA";
        const isMovie = anime.type === "Movie";
        const isSpecial = anime.type === "Special";
        const isOVA = anime.type === "OVA";

        const entry: SeasonEntry = {
          mal_id: anime.mal_id,
          title: anime.title,
          title_english: anime.title_english,
          images: anime.images,
          episodes: anime.episodes,
          aired: anime.aired,
          season: anime.season,
          year: anime.year,
          type: anime.type,
          synopsis: anime.synopsis,
          isFilm: isMovie,
        };

        if (isTVOrONA) {
          allSeasons.push(entry);
        } else if (isMovie) {
          // Try to determine watch order for movies based on air date
          const movieAirDate = anime.aired?.from ? new Date(anime.aired.from) : null;
          if (movieAirDate) {
            // Find which season this movie comes after
            for (let i = allSeasons.length - 1; i >= 0; i--) {
              const season = allSeasons[i];
              const seasonEndDate = season.aired?.to ? new Date(season.aired.to) : null;
              if (seasonEndDate && movieAirDate > seasonEndDate) {
                entry.watchAfterSeason = i + 1;
                break;
              }
            }
          }
          allFilms.push(entry);
        } else if (isSpecial || isOVA) {
          // Include specials and OVAs with films
          entry.isFilm = true;
          allFilms.push(entry);
        }
      }

      // Sort seasons by air date
      allSeasons.sort((a, b) => {
        const dateA = a.aired?.from ? new Date(a.aired.from).getTime() : 0;
        const dateB = b.aired?.from ? new Date(b.aired.from).getTime() : 0;
        return dateA - dateB;
      });

      // Sort films by air date
      allFilms.sort((a, b) => {
        const dateA = a.aired?.from ? new Date(a.aired.from).getTime() : 0;
        const dateB = b.aired?.from ? new Date(b.aired.from).getTime() : 0;
        return dateA - dateB;
      });

      // Update watch order for films based on sorted seasons
      for (const film of allFilms) {
        const filmAirDate = film.aired?.from ? new Date(film.aired.from) : null;
        if (filmAirDate) {
          for (let i = allSeasons.length - 1; i >= 0; i--) {
            const season = allSeasons[i];
            const seasonEndDate = season.aired?.to ? new Date(season.aired.to) : null;
            const seasonStartDate = season.aired?.from ? new Date(season.aired.from) : null;
            
            if (seasonEndDate && filmAirDate > seasonEndDate) {
              film.watchAfterSeason = i + 1;
              break;
            } else if (seasonStartDate && seasonEndDate && 
                       filmAirDate >= seasonStartDate && filmAirDate <= seasonEndDate) {
              // Movie released during a season - suggest after previous season
              film.watchAfterSeason = i > 0 ? i : 1;
              break;
            }
          }
        }
      }

      return { seasons: allSeasons, films: allFilms };
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!animeId,
  });
};

// Fetch all episodes for an anime (handles pagination) with German titles
export const useAllAnimeEpisodes = (animeId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["allAnimeEpisodes", animeId],
    queryFn: async () => {
      const allEpisodes: any[] = [];
      let page = 1;
      let hasNextPage = true;
      let consecutiveErrors = 0;

      while (hasNextPage && page <= 50 && consecutiveErrors < 3) {
        try {
          const data = await fetchAnimeEpisodes(animeId, page);
          const episodes = data.data || [];
          
          if (episodes.length === 0) {
            // If first page returns no episodes, try fetching anime details for episode count
            if (page === 1) {
              const animeDetails = await fetchAnimeDetails(animeId);
              if (animeDetails?.episodes) {
                // Create placeholder episodes if API doesn't return episode list
                for (let i = 1; i <= animeDetails.episodes; i++) {
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
            }
            break;
          }
          
          consecutiveErrors = 0;
          allEpisodes.push(...episodes);
          hasNextPage = data.pagination?.has_next_page || false;
          page++;
        } catch (error) {
          console.error("Error fetching episodes page:", page, error);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) break;
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

// Calculate total episodes across all seasons
export const calculateTotalEpisodes = (seasons: SeasonEntry[]): number => {
  return seasons.reduce((total, season) => total + (season.episodes || 0), 0);
};

// Get episode count for a specific season
export const getSeasonEpisodeCount = async (animeId: number): Promise<number> => {
  const anime = await fetchAnimeDetails(animeId);
  return anime?.episodes || 0;
};

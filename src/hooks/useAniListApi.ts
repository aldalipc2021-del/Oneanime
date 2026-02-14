import { useQuery } from "@tanstack/react-query";

const ANILIST_URL = "https://graphql.anilist.co";

// GraphQL helper
const anilistQuery = async (query: string, variables: Record<string, any> = {}) => {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      throw new Error("Rate limited - bitte warte kurz");
    }
    throw new Error(`AniList API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL error");
  return data.data;
};

// Shared media fields fragment
const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  coverImage { medium large extraLarge }
  bannerImage
  description(asHtml: false)
  averageScore
  popularity
  episodes
  status
  season
  seasonYear
  format
  duration
  genres
  source
  isAdult
  startDate { year month day }
  endDate { year month day }
  studios(isMain: true) { nodes { id name } }
  trailer { id site }
`;

const MEDIA_FIELDS_FULL = `
  ${MEDIA_FIELDS}
  relations {
    edges {
      relationType
      node {
        id
        idMal
        title { romaji english native }
        coverImage { medium large extraLarge }
        format
        episodes
        status
        startDate { year month day }
        endDate { year month day }
        season
        seasonYear
      }
    }
  }
  recommendations(page: 1, perPage: 12) {
    nodes {
      mediaRecommendation {
        id
        idMal
        title { romaji english native }
        coverImage { medium large extraLarge }
        averageScore
        episodes
        status
        format
      }
    }
  }
  streamingEpisodes { title thumbnail url site }
  externalLinks { url site type }
`;

// Types
export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { medium: string; large: string; extraLarge: string };
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  duration: number | null;
  genres: string[];
  source: string | null;
  isAdult: boolean;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  studios: { nodes: { id: number; name: string }[] } | null;
  trailer: { id: string; site: string } | null;
  relations?: {
    edges: {
      relationType: string;
      node: AniListMedia;
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: AniListMedia | null;
    }[];
  };
  streamingEpisodes?: { title: string; thumbnail: string; url: string; site: string }[];
  externalLinks?: { url: string; site: string; type: string }[];
}

// Mapped interface for backward compatibility
export interface Anime {
  mal_id: number;
  anilist_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  synopsis: string;
  score: number;
  scored_by: number;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: { from: string; to: string; string: string };
  duration: string;
  rating: string;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  source: string;
  type: string;
  year: number;
  season: string;
  trailer: { youtube_id: string; url: string };
  relations?: {
    relation: string;
    entry: { mal_id: number; type: string; name: string }[];
  }[];
  // AniList specific
  _anilistRelations?: AniListMedia["relations"];
  _streamingEpisodes?: AniListMedia["streamingEpisodes"];
  _externalLinks?: AniListMedia["externalLinks"];
  _recommendations?: AniListMedia["recommendations"];
}

// Helper to format date from AniList format
const formatDate = (date: { year: number | null; month: number | null; day: number | null } | null): string => {
  if (!date || !date.year) return "";
  const y = date.year;
  const m = date.month ? String(date.month).padStart(2, "0") : "01";
  const d = date.day ? String(date.day).padStart(2, "0") : "01";
  return `${y}-${m}-${d}T00:00:00+00:00`;
};

const formatDateString = (date: { year: number | null; month: number | null; day: number | null } | null): string => {
  if (!date || !date.year) return "TBA";
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const parts: string[] = [];
  if (date.month) parts.push(months[date.month - 1]);
  parts.push(String(date.year));
  return parts.join(" ");
};

// Map AniList status to Jikan-like status
const mapStatus = (status: string): string => {
  switch (status) {
    case "RELEASING": return "Currently Airing";
    case "FINISHED": return "Finished Airing";
    case "NOT_YET_RELEASED": return "Not yet aired";
    case "CANCELLED": return "Cancelled";
    case "HIATUS": return "On Hiatus";
    default: return status;
  }
};

// Map AniList format to type
const mapFormat = (format: string | null): string => {
  switch (format) {
    case "TV": return "TV";
    case "TV_SHORT": return "TV";
    case "MOVIE": return "Movie";
    case "SPECIAL": return "Special";
    case "OVA": return "OVA";
    case "ONA": return "ONA";
    case "MUSIC": return "Music";
    default: return format || "Unknown";
  }
};

// Map AniList media to our Anime interface
export const mapAniListToAnime = (media: AniListMedia): Anime => {
  return {
    mal_id: media.id, // Use AniList ID for navigation
    anilist_id: media.id,
    title: media.title.romaji || media.title.english || "",
    title_english: media.title.english,
    title_japanese: media.title.native,
    images: {
      jpg: {
        image_url: media.coverImage.medium || media.coverImage.large,
        large_image_url: media.coverImage.extraLarge || media.coverImage.large,
      },
      webp: {
        image_url: media.coverImage.medium || media.coverImage.large,
        large_image_url: media.coverImage.extraLarge || media.coverImage.large,
      },
    },
    synopsis: media.description?.replace(/<[^>]*>/g, "") || "",
    score: media.averageScore ? media.averageScore / 10 : 0,
    scored_by: media.popularity || 0,
    episodes: media.episodes,
    status: mapStatus(media.status),
    airing: media.status === "RELEASING",
    aired: {
      from: formatDate(media.startDate),
      to: formatDate(media.endDate),
      string: `${formatDateString(media.startDate)} bis ${formatDateString(media.endDate)}`,
    },
    duration: media.duration ? `${media.duration} Min. pro Ep.` : "",
    rating: media.isAdult ? "R+ - Mild Nudity" : "",
    genres: media.genres.map((g, i) => ({ mal_id: i, name: g })),
    studios: media.studios?.nodes.map(s => ({ mal_id: s.id, name: s.name })) || [],
    source: media.source?.replace(/_/g, " ") || "Original",
    type: mapFormat(media.format),
    year: media.seasonYear || (media.startDate?.year || 0),
    season: media.season?.toLowerCase() || "",
    trailer: {
      youtube_id: media.trailer?.site === "youtube" ? media.trailer.id : "",
      url: media.trailer?.site === "youtube" ? `https://youtube.com/watch?v=${media.trailer.id}` : "",
    },
    _anilistRelations: media.relations,
    _streamingEpisodes: media.streamingEpisodes,
    _externalLinks: media.externalLinks,
    _recommendations: media.recommendations,
  };
};

// Fetch top/trending anime
export const useTopAnime = (filter: string = "airing", page: number = 1) => {
  return useQuery({
    queryKey: ["topAnime", filter, page],
    queryFn: async () => {
      let sort: string[];
      let status: string | undefined;

      switch (filter) {
        case "airing":
          sort = ["TRENDING_DESC"];
          status = "RELEASING";
          break;
        case "upcoming":
          sort = ["POPULARITY_DESC"];
          status = "NOT_YET_RELEASED";
          break;
        case "bypopularity":
          sort = ["POPULARITY_DESC"];
          break;
        case "favorite":
          sort = ["FAVOURITES_DESC"];
          break;
        default:
          sort = ["TRENDING_DESC"];
      }

      const query = `
        query ($page: Int, $perPage: Int, $sort: [MediaSort], $status: MediaStatus) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage }
            media(type: ANIME, sort: $sort, status: $status, isAdult: false) {
              ${MEDIA_FIELDS}
            }
          }
        }
      `;

      const data = await anilistQuery(query, {
        page,
        perPage: 24,
        sort,
        status: status || undefined,
      });

      return {
        data: data.Page.media.map(mapAniListToAnime),
        pagination: data.Page.pageInfo,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch seasonal anime
export const useSeasonalAnime = (year?: number, season?: string) => {
  const currentDate = new Date();
  const currentYear = year || currentDate.getFullYear();
  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const currentSeason = season?.toUpperCase() || seasons[Math.floor(currentDate.getMonth() / 3)];

  return useQuery({
    queryKey: ["seasonalAnime", currentYear, currentSeason],
    queryFn: async () => {
      const query = `
        query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage }
            media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
              ${MEDIA_FIELDS}
            }
          }
        }
      `;

      const data = await anilistQuery(query, {
        season: currentSeason,
        seasonYear: currentYear,
        page: 1,
        perPage: 24,
      });

      return {
        data: data.Page.media.map(mapAniListToAnime),
        pagination: data.Page.pageInfo,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch anime by AniList ID (tries AniList ID first, then MAL ID)
export const useAnimeById = (id: number) => {
  return useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      // Try AniList ID first
      try {
        const query = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) { ${MEDIA_FIELDS_FULL} }
          }
        `;
        const data = await anilistQuery(query, { id });
        if (data.Media) return mapAniListToAnime(data.Media);
      } catch {
        // Not found by AniList ID
      }

      // Fall back to MAL ID
      try {
        const query = `
          query ($idMal: Int) {
            Media(idMal: $idMal, type: ANIME) { ${MEDIA_FIELDS_FULL} }
          }
        `;
        const data = await anilistQuery(query, { idMal: id });
        if (data.Media) return mapAniListToAnime(data.Media);
      } catch {
        // Not found by MAL ID either
      }

      throw new Error("Anime not found");
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

// Search anime
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

export const useSearchAnime = (params: AnimeSearchParams) => {
  return useQuery({
    queryKey: ["searchAnime", JSON.stringify(params)],
    queryFn: async () => {
      const variables: Record<string, any> = {
        page: params.page || 1,
        perPage: params.limit || 24,
        sort: ["POPULARITY_DESC"],
      };

      if (params.q) variables.search = params.q;
      if (params.status) {
        const statusMap: Record<string, string> = {
          airing: "RELEASING",
          complete: "FINISHED",
          upcoming: "NOT_YET_RELEASED",
        };
        variables.status = statusMap[params.status] || undefined;
      }
      if (params.type) {
        const formatMap: Record<string, string> = {
          tv: "TV",
          movie: "MOVIE",
          ova: "OVA",
          special: "SPECIAL",
        };
        variables.format = formatMap[params.type] || undefined;
      }
      if (params.genres) {
        variables.genre_in = params.genres.split(",");
      }

      const query = `
        query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $status: MediaStatus, $format: MediaFormat, $genre_in: [String]) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage }
            media(type: ANIME, search: $search, sort: $sort, status: $status, format: $format, genre_in: $genre_in, isAdult: false) {
              ${MEDIA_FIELDS}
            }
          }
        }
      `;

      const data = await anilistQuery(query, variables);

      return {
        data: data.Page.media.map(mapAniListToAnime),
        pagination: {
          ...data.Page.pageInfo,
          items: { total: data.Page.pageInfo.total },
        },
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!params.q || !!params.genres || !!params.status,
  });
};

// Fetch anime recommendations
export const useAnimeRecommendations = (id: number) => {
  // Recommendations are included in the full anime query
  // This hook exists for backward compat but data comes from useAnimeById
  return useQuery({
    queryKey: ["animeRecommendations", id],
    queryFn: async () => {
      const query = `
        query ($idMal: Int, $id: Int) {
          mal: Media(idMal: $idMal, type: ANIME) {
            recommendations(page: 1, perPage: 12) {
              nodes {
                mediaRecommendation {
                  id
                  idMal
                  title { romaji english native }
                  coverImage { medium large extraLarge }
                  averageScore
                  episodes
                  status
                  format
                }
              }
            }
          }
        }
      `;

      try {
        const data = await anilistQuery(query, { idMal: id });
        if (data.mal?.recommendations?.nodes) {
          return data.mal.recommendations.nodes
            .filter((n: any) => n.mediaRecommendation)
            .map((n: any) => ({
              entry: mapAniListToAnime(n.mediaRecommendation),
            }));
        }
      } catch {
        // Try AniList ID
        const fallback = await anilistQuery(query.replace("$idMal: Int, $id: Int", "$id: Int").replace("idMal: $idMal", "id: $id"), { id });
        if (fallback.mal?.recommendations?.nodes) {
          return fallback.mal.recommendations.nodes
            .filter((n: any) => n.mediaRecommendation)
            .map((n: any) => ({
              entry: mapAniListToAnime(n.mediaRecommendation),
            }));
        }
      }
      return [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!id,
  });
};

// Fetch genres
export const useGenres = () => {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const query = `
        query {
          GenreCollection
        }
      `;
      const data = await anilistQuery(query);
      return (data.GenreCollection || []).map((name: string, index: number) => ({
        mal_id: index,
        name,
      }));
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Fetch schedule (currently airing)
export const useSchedule = (day?: string) => {
  return useQuery({
    queryKey: ["schedule", day],
    queryFn: async () => {
      // AniList doesn't have a direct schedule endpoint like Jikan
      // We fetch currently airing anime and group by broadcast day
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
              ${MEDIA_FIELDS}
              nextAiringEpisode { airingAt timeUntilAiring episode }
            }
          }
        }
      `;

      const data = await anilistQuery(query, { page: 1, perPage: 50 });

      const mapped = data.Page.media.map((m: any) => {
        const anime = mapAniListToAnime(m);
        // Determine broadcast day from nextAiringEpisode
        let broadcastDay = "";
        let broadcastTime = "TBA";
        if (m.nextAiringEpisode?.airingAt) {
          const airDate = new Date(m.nextAiringEpisode.airingAt * 1000);
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          broadcastDay = days[airDate.getUTCDay()];
          broadcastTime = airDate.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Tokyo",
          });
        }
        return {
          ...anime,
          broadcast: { day: broadcastDay, time: broadcastTime },
          nextEpisode: m.nextAiringEpisode?.episode || null,
        };
      });

      if (day) {
        return mapped.filter((a: any) => a.broadcast.day === day);
      }
      return mapped;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Get display title (prefer English over Romaji)
export const getDisplayTitle = (anime: Anime | { title: string; title_english?: string | null }) => {
  return anime.title_english || anime.title;
};

// Fetch anime by AniList ID directly
export const fetchAniListMediaById = async (anilistId: number): Promise<AniListMedia | null> => {
  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) { ${MEDIA_FIELDS_FULL} }
      }
    `;
    const data = await anilistQuery(query, { id: anilistId });
    return data.Media;
  } catch {
    return null;
  }
};

// Fetch anime by MAL ID directly  
export const fetchAniListMediaByMalId = async (malId: number): Promise<AniListMedia | null> => {
  try {
    const query = `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) { ${MEDIA_FIELDS_FULL} }
      }
    `;
    const data = await anilistQuery(query, { idMal: malId });
    return data.Media;
  } catch {
    return null;
  }
};

// Episode interface (kept for backward compat, episodes still from Jikan)
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

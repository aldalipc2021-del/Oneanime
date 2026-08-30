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

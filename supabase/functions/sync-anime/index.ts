import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANILIST_URL = "https://graphql.anilist.co";
const TMDB_BASE = "https://api.themoviedb.org/3";

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string; large: string } | null;
  description: string | null;
  genres: string[];
  status: string;
  format: string;
  episodes: number | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  trailer: { site: string; id: string } | null;
  relations: {
    edges: { relationType: string; node: AniListMedia }[];
  } | null;
}

const ANILIST_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    coverImage { extraLarge large }
    description
    genres
    status
    format
    episodes
    startDate { year month day }
    endDate { year month day }
    trailer { site id }
    relations {
      edges {
        relationType
        node {
          id
          title { romaji english native }
          coverImage { extraLarge large }
          description
          genres
          status
          format
          episodes
          startDate { year month day }
          endDate { year month day }
          trailer { site id }
          relations {
            edges {
              relationType
              node {
                id
                title { romaji english native }
                coverImage { extraLarge large }
                description
                genres
                status
                format
                episodes
                startDate { year month day }
                endDate { year month day }
                trailer { site id }
              }
            }
          }
        }
      }
    }
  }
}`;

function dateFromAniList(d: { year: number | null; month: number | null; day: number | null } | null): string | null {
  if (!d || !d.year) return null;
  const m = String(d.month || 1).padStart(2, "0");
  const day = String(d.day || 1).padStart(2, "0");
  return `${d.year}-${m}-${day}`;
}

function trailerUrl(t: { site: string; id: string } | null): string | null {
  if (!t) return null;
  if (t.site === "youtube") return `https://www.youtube.com/watch?v=${t.id}`;
  return null;
}

// BFS to collect all sequel/prequel TV entries
function collectSeries(startMedia: AniListMedia): AniListMedia[] {
  const visited = new Set<number>();
  const queue: AniListMedia[] = [startMedia];
  const results: AniListMedia[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (["TV", "ONA", "TV_SHORT"].includes(current.format)) {
      results.push(current);
    }

    if (current.relations?.edges) {
      for (const edge of current.relations.edges) {
        if (["SEQUEL", "PREQUEL"].includes(edge.relationType) && !visited.has(edge.node.id)) {
          queue.push(edge.node);
        }
      }
    }
  }

  // Sort by start date
  results.sort((a, b) => {
    const da = dateFromAniList(a.startDate) || "9999";
    const db = dateFromAniList(b.startDate) || "9999";
    return da.localeCompare(db);
  });

  return results;
}

async function fetchTmdbEpisodes(
  title: string,
  seasonNum: number,
  episodeCount: number,
  tmdbKey: string
): Promise<Array<{ episode_number: number; title: string | null; title_jp: string | null; synopsis: string | null; air_date: string | null; duration_minutes: number | null; thumbnail: string | null }>> {
  try {
    // Search TMDB for the show
    const searchRes = await fetch(`${TMDB_BASE}/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(title)}&language=en-US`);
    const searchData = await searchRes.json();
    if (!searchData.results?.length) return generatePlaceholderEpisodes(episodeCount);

    const showId = searchData.results[0].id;

    // Fetch season details
    const seasonRes = await fetch(`${TMDB_BASE}/tv/${showId}/season/${seasonNum}?api_key=${tmdbKey}&language=en-US`);
    if (!seasonRes.ok) return generatePlaceholderEpisodes(episodeCount);
    const seasonData = await seasonRes.json();

    if (!seasonData.episodes?.length) return generatePlaceholderEpisodes(episodeCount);

    return seasonData.episodes.map((ep: any) => ({
      episode_number: ep.episode_number,
      title: ep.name || null,
      title_jp: null,
      synopsis: ep.overview || null,
      air_date: ep.air_date || null,
      duration_minutes: ep.runtime || null,
      thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
    }));
  } catch {
    return generatePlaceholderEpisodes(episodeCount);
  }
}

function generatePlaceholderEpisodes(count: number) {
  const eps = [];
  for (let i = 1; i <= (count || 12); i++) {
    eps.push({ episode_number: i, title: `Episode ${i}`, title_jp: null, synopsis: null, air_date: null, duration_minutes: null, thumbnail: null });
  }
  return eps;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anilist_id } = await req.json();
    if (!anilist_id || typeof anilist_id !== "number") {
      return new Response(JSON.stringify({ error: "anilist_id (number) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tmdbKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbKey) {
      return new Response(JSON.stringify({ error: "TMDB_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch from AniList
    const aniRes = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { id: anilist_id } }),
    });
    const aniData = await aniRes.json();
    const startMedia = aniData?.data?.Media;
    if (!startMedia) {
      return new Response(JSON.stringify({ error: "Anime not found on AniList" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Collect all related seasons via BFS
    const allSeasons = collectSeries(startMedia);
    if (allSeasons.length === 0) {
      return new Response(JSON.stringify({ error: "No TV seasons found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Use the first season as the "series" identity
    const first = allSeasons[0];
    const seriesTitle = first.title.english || first.title.romaji;
    const allGenres = [...new Set(allSeasons.flatMap((s) => s.genres))];

    // 4. Upsert series
    const { data: seriesRow, error: seriesErr } = await supabase
      .from("series")
      .upsert(
        {
          anilist_id: first.id,
          title: seriesTitle,
          title_en: first.title.english,
          title_jp: first.title.native,
          cover_image: first.coverImage?.extraLarge || first.coverImage?.large || null,
          description: first.description?.replace(/<[^>]*>/g, "") || null,
          genres: allGenres,
          status: first.status?.toLowerCase() || "unknown",
        },
        { onConflict: "anilist_id" }
      )
      .select("id")
      .single();

    if (seriesErr) {
      return new Response(JSON.stringify({ error: "Failed to upsert series", details: seriesErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const seriesId = seriesRow.id;
    const seasonResults = [];

    // 5. Upsert each season + episodes
    for (let i = 0; i < allSeasons.length; i++) {
      const s = allSeasons[i];
      const seasonNumber = i + 1;

      const { data: seasonRow, error: seasonErr } = await supabase
        .from("seasons")
        .upsert(
          {
            series_id: seriesId,
            season_number: seasonNumber,
            anilist_id: s.id,
            title: s.title.english || s.title.romaji,
            episode_count: s.episodes,
            aired_from: dateFromAniList(s.startDate),
            aired_to: dateFromAniList(s.endDate),
            cover_image: s.coverImage?.extraLarge || s.coverImage?.large || null,
            trailer_url: trailerUrl(s.trailer),
            status: s.status?.toLowerCase() || "unknown",
          },
          { onConflict: "anilist_id" }
        )
        .select("id")
        .single();

      if (seasonErr) {
        seasonResults.push({ anilist_id: s.id, error: seasonErr.message });
        continue;
      }

      // Fetch episodes from TMDB
      const searchTitle = s.title.romaji || s.title.english || seriesTitle;
      const tmdbEpisodes = await fetchTmdbEpisodes(searchTitle, seasonNumber, s.episodes || 12, tmdbKey);

      // Upsert episodes
      const episodeRows = tmdbEpisodes.map((ep) => ({
        season_id: seasonRow.id,
        episode_number: ep.episode_number,
        title: ep.title,
        title_jp: ep.title_jp,
        synopsis: ep.synopsis,
        air_date: ep.air_date,
        duration_minutes: ep.duration_minutes,
        thumbnail: ep.thumbnail,
      }));

      if (episodeRows.length > 0) {
        const { error: epErr } = await supabase
          .from("episodes")
          .upsert(episodeRows, { onConflict: "season_id,episode_number" });

        if (epErr) {
          seasonResults.push({ anilist_id: s.id, season_number: seasonNumber, episodes_error: epErr.message });
        } else {
          seasonResults.push({ anilist_id: s.id, season_number: seasonNumber, episodes: episodeRows.length });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, series_id: seriesId, series_title: seriesTitle, seasons: seasonResults }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

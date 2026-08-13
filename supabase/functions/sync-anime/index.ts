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
        node { id format }
      }
    }
  }
}`;

async function fetchAniListMedia(id: number): Promise<AniListMedia | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { id } }),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    const json = await res.json();
    return json?.data?.Media ?? null;
  }
  return null;
}


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

// BFS across the whole sequel/prequel chain (fetches every node from AniList)
async function collectSeries(startMedia: AniListMedia): Promise<AniListMedia[]> {
  const visited = new Set<number>([startMedia.id]);
  const queue: AniListMedia[] = [startMedia];
  const results: AniListMedia[] = [];
  const MAX_NODES = 40;

  while (queue.length > 0 && visited.size <= MAX_NODES) {
    const current = queue.shift()!;

    if (["TV", "ONA", "TV_SHORT"].includes(current.format)) {
      results.push(current);
    }

    for (const edge of current.relations?.edges ?? []) {
      if (!["SEQUEL", "PREQUEL"].includes(edge.relationType)) continue;
      if (visited.has(edge.node.id)) continue;
      if (!["TV", "ONA", "TV_SHORT"].includes(edge.node.format)) continue;
      visited.add(edge.node.id);
      const full = await fetchAniListMedia(edge.node.id);
      if (full) queue.push(full);
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


interface TmdbEpisode {
  episode_number: number;
  title: string | null;
  title_jp: string | null;
  title_de: string | null;
  synopsis: string | null;
  synopsis_de: string | null;
  air_date: string | null;
  duration_minutes: number | null;
  thumbnail: string | null;
}

const IMG = (path: string | null | undefined, size: string) =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

async function tmdbJson(path: string, tmdbKey: string): Promise<any | null> {
  try {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${tmdbKey}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Resolve a TMDB TV show id from a title (+ optional first air year)
async function resolveTmdbShowId(title: string, year: number | null, tmdbKey: string): Promise<number | null> {
  const q = encodeURIComponent(title);
  const withYear = year ? `&first_air_date_year=${year}` : "";
  let data = await tmdbJson(`/search/tv?query=${q}&language=en-US${withYear}`, tmdbKey);
  if (!data?.results?.length && year) {
    data = await tmdbJson(`/search/tv?query=${q}&language=en-US`, tmdbKey);
  }
  return data?.results?.[0]?.id ?? null;
}

// Details in English + German (images, german title/overview)
async function tmdbShowInfo(showId: number, tmdbKey: string) {
  const [en, de] = await Promise.all([
    tmdbJson(`/tv/${showId}?language=en-US`, tmdbKey),
    tmdbJson(`/tv/${showId}?language=de-DE`, tmdbKey),
  ]);
  return {
    backdrop_image: IMG(en?.backdrop_path || de?.backdrop_path, "w1280"),
    poster_image: IMG(en?.poster_path || de?.poster_path, "w500"),
    title_de: de?.name || null,
    description_de: de?.overview || null,
    description_en: en?.overview || null,
  };
}

// Watch providers per country (flatrate / rent / buy)
async function tmdbWatchProviders(showId: number, tmdbKey: string) {
  const data = await tmdbJson(`/tv/${showId}/watch/providers`, tmdbKey);
  const rows: Array<{
    country: string;
    provider_name: string;
    provider_id: number | null;
    logo_url: string | null;
    offer_type: string;
    link: string | null;
    display_priority: number | null;
  }> = [];
  const results = data?.results || {};
  for (const country of Object.keys(results)) {
    const entry = results[country];
    for (const offerType of ["flatrate", "rent", "buy", "free", "ads"]) {
      for (const p of entry?.[offerType] || []) {
        rows.push({
          country,
          provider_name: p.provider_name,
          provider_id: p.provider_id ?? null,
          logo_url: IMG(p.logo_path, "w92"),
          offer_type: offerType,
          link: entry.link || null,
          display_priority: p.display_priority ?? null,
        });
      }
    }
  }
  // De-duplicate on (country, provider, offer_type)
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${r.country}|${r.provider_name}|${r.offer_type}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function fetchTmdbEpisodes(
  showId: number | null,
  seasonNum: number,
  episodeCount: number,
  tmdbKey: string
): Promise<TmdbEpisode[]> {
  if (!showId) return generatePlaceholderEpisodes(episodeCount);

  const [en, de] = await Promise.all([
    tmdbJson(`/tv/${showId}/season/${seasonNum}?language=en-US`, tmdbKey),
    tmdbJson(`/tv/${showId}/season/${seasonNum}?language=de-DE`, tmdbKey),
  ]);

  if (!en?.episodes?.length) return generatePlaceholderEpisodes(episodeCount);

  const deMap = new Map<number, any>();
  for (const ep of de?.episodes || []) deMap.set(ep.episode_number, ep);

  return en.episodes.map((ep: any) => {
    const deEp = deMap.get(ep.episode_number);
    return {
      episode_number: ep.episode_number,
      title: ep.name || null,
      title_jp: null,
      title_de: deEp?.name || null,
      synopsis: ep.overview || null,
      synopsis_de: deEp?.overview || null,
      air_date: ep.air_date || null,
      duration_minutes: ep.runtime || null,
      thumbnail: IMG(ep.still_path, "w300"),
    };
  });
}

function generatePlaceholderEpisodes(count: number): TmdbEpisode[] {
  const eps: TmdbEpisode[] = [];
  for (let i = 1; i <= (count || 12); i++) {
    eps.push({ episode_number: i, title: `Episode ${i}`, title_jp: null, title_de: null, synopsis: null, synopsis_de: null, air_date: null, duration_minutes: null, thumbnail: null });
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
    const startMedia = await fetchAniListMedia(anilist_id);
    if (!startMedia) {
      return new Response(JSON.stringify({ error: "Anime not found on AniList" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Collect all related seasons via BFS
    const allSeasons = await collectSeries(startMedia);
    if (allSeasons.length === 0) {
      return new Response(JSON.stringify({ error: "No TV seasons found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    // 3. Use the first season as the "series" identity
    const first = allSeasons[0];
    const seriesTitle = first.title.english || first.title.romaji;
    const allGenres = [...new Set(allSeasons.flatMap((s) => s.genres))];

    // 4. Resolve the series on TMDB and pull images / german texts
    const seriesTmdbId = await resolveTmdbShowId(
      first.title.english || first.title.romaji,
      first.startDate?.year ?? null,
      tmdbKey
    );
    const seriesTmdbInfo = seriesTmdbId ? await tmdbShowInfo(seriesTmdbId, tmdbKey) : null;

    // 5. Upsert series
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
          tmdb_id: seriesTmdbId,
          backdrop_image: seriesTmdbInfo?.backdrop_image || null,
          poster_image: seriesTmdbInfo?.poster_image || null,
          title_de: seriesTmdbInfo?.title_de || null,
          description_de: seriesTmdbInfo?.description_de || null,
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

    // 5b. Merge duplicate series rows that belong to this same chain
    const chainIds = allSeasons.map((s) => s.id);
    const { data: dupSeries } = await supabase
      .from("series")
      .select("id")
      .in("anilist_id", chainIds)
      .neq("id", seriesId);

    let mergedSeries = 0;
    if (dupSeries && dupSeries.length > 0) {
      const dupIds = dupSeries.map((d: { id: string }) => d.id);
      await supabase.from("seasons").update({ series_id: seriesId }).in("series_id", dupIds);
      await supabase.from("streaming_providers").delete().in("series_id", dupIds);
      await supabase.from("series").delete().in("id", dupIds);
      mergedSeries = dupIds.length;
    }


    // 6. Streaming providers per country from TMDB
    let providerCount = 0;
    if (seriesTmdbId) {
      const providers = await tmdbWatchProviders(seriesTmdbId, tmdbKey);
      if (providers.length > 0) {
        const { error: provErr } = await supabase
          .from("streaming_providers")
          .upsert(
            providers.map((p) => ({ series_id: seriesId, ...p })),
            { onConflict: "series_id,country,provider_name,offer_type" }
          );
        if (!provErr) providerCount = providers.length;
      }
    }

    // 7. Upsert each season + episodes
    for (let i = 0; i < allSeasons.length; i++) {
      const s = allSeasons[i];
      const seasonNumber = i + 1;

      // Resolve this season on TMDB (own show entry or a season of the series show)
      const seasonTmdbId =
        (await resolveTmdbShowId(s.title.english || s.title.romaji, s.startDate?.year ?? null, tmdbKey)) ??
        seriesTmdbId;
      const isOwnShow = !!seasonTmdbId && seasonTmdbId !== seriesTmdbId;
      const tmdbSeasonNumber = isOwnShow ? 1 : seasonNumber;
      const seasonTmdbInfo = seasonTmdbId ? await tmdbShowInfo(seasonTmdbId, tmdbKey) : null;

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
            tmdb_id: seasonTmdbId,
            backdrop_image: seasonTmdbInfo?.backdrop_image || null,
            title_de: seasonTmdbInfo?.title_de || null,
            description_de: seasonTmdbInfo?.description_de || null,
          },
          { onConflict: "anilist_id" }
        )
        .select("id")
        .single();

      if (seasonErr) {
        seasonResults.push({ anilist_id: s.id, error: seasonErr.message });
        continue;
      }

      // Fetch episodes from TMDB (english + german)
      const tmdbEpisodes = await fetchTmdbEpisodes(seasonTmdbId, tmdbSeasonNumber, s.episodes || 12, tmdbKey);

      // Upsert episodes
      const episodeRows = tmdbEpisodes.map((ep) => ({
        season_id: seasonRow.id,
        episode_number: ep.episode_number,
        title: ep.title,
        title_jp: ep.title_jp,
        title_de: ep.title_de,
        synopsis: ep.synopsis,
        synopsis_de: ep.synopsis_de,
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
          seasonResults.push({ anilist_id: s.id, season_number: seasonNumber, tmdb_id: seasonTmdbId, episodes: episodeRows.length });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, series_id: seriesId, series_title: seriesTitle, tmdb_id: seriesTmdbId, merged_series: mergedSeries, streaming_providers: providerCount, seasons: seasonResults }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

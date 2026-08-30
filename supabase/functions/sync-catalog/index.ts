import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANILIST_URL = "https://graphql.anilist.co";
const JOB_PREFIX = "anilist_catalog";
const PER_PAGE = 50;

// AniList caps paging at 5000 entries per query, so the catalog is imported
// in partitions (one per season year).
const CATALOG_QUERY = `
query ($page: Int, $perPage: Int, $popularity: Int, $year: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage }
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false, popularity_greater: $popularity, seasonYear: $year) {
      id
      title { romaji english native }
      coverImage { extraLarge large }
      description
      genres
      status
      format
      episodes
      popularity
      seasonYear
      startDate { year }
    }
  }
}`;

interface CatalogMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string | null; large: string | null } | null;
  description: string | null;
  genres: string[];
  status: string | null;
  format: string | null;
  episodes: number | null;
  popularity: number | null;
  seasonYear: number | null;
  startDate: { year: number | null } | null;
}

async function fetchPage(
  page: number,
  popularity: number,
  year: number | null,
): Promise<{ media: CatalogMedia[]; hasNextPage: boolean }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CATALOG_QUERY,
        variables: { page, perPage: PER_PAGE, popularity, year: year ?? undefined },
      }),
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") || "5");
      await new Promise((r) => setTimeout(r, Math.max(retryAfter, 5) * 1000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AniList error [${res.status}]: ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || "AniList GraphQL error");

    return {
      media: json?.data?.Page?.media ?? [],
      hasNextPage: !!json?.data?.Page?.pageInfo?.hasNextPage,
    };
  }
  throw new Error("AniList rate limit: giving up after retries");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const pages = Math.min(Math.max(Number(body.pages) || 20, 1), 40);
    const minPopularity = Number.isFinite(Number(body.min_popularity)) ? Number(body.min_popularity) : 0;
    const year = Number.isFinite(Number(body.year)) && Number(body.year) > 1900 ? Number(body.year) : null;
    const restart = body.restart === true;
    const jobName = year ? `${JOB_PREFIX}_${year}` : JOB_PREFIX;

    // Load / init progress
    const { data: state } = await supabase
      .from("sync_state")
      .select("*")
      .eq("job_name", jobName)
      .maybeSingle();

    const startPage = restart || !state ? 1 : (state.last_page || 0) + 1;
    let totalItems = restart || !state ? 0 : state.total_items || 0;

    await supabase
      .from("sync_state")
      .upsert(
        { job_name: jobName, last_page: startPage - 1, total_items: totalItems, status: "running", last_error: null },
        { onConflict: "job_name" },
      );

    let page = startPage;
    let hasNextPage = true;
    let imported = 0;
    let lastCompletedPage = startPage - 1;

    for (let i = 0; i < pages && hasNextPage; i++) {
      const { media, hasNextPage: next } = await fetchPage(page, minPopularity, year);
      hasNextPage = next;


      if (media.length > 0) {
        const rows = media.map((m) => ({
          anilist_id: m.id,
          title: m.title.english || m.title.romaji,
          title_en: m.title.english,
          title_jp: m.title.native,
          cover_image: m.coverImage?.extraLarge || m.coverImage?.large || null,
          description: m.description?.replace(/<[^>]*>/g, "") || null,
          genres: m.genres ?? [],
          status: m.status?.toLowerCase() || "unknown",
          format: m.format || null,
          year: m.seasonYear ?? m.startDate?.year ?? null,
          episode_count: m.episodes,
          popularity: m.popularity ?? 0,
        }));

        // Do not overwrite rows already merged into a chain by sync-anime:
        // skip anilist_ids that exist as a *season* of another series.
        const ids = rows.map((r) => r.anilist_id);
        const { data: existingSeasons } = await supabase
          .from("seasons")
          .select("anilist_id")
          .in("anilist_id", ids);
        const seasonIds = new Set((existingSeasons ?? []).map((s: { anilist_id: number }) => s.anilist_id));
        const insertable = rows.filter((r) => !seasonIds.has(r.anilist_id));

        if (insertable.length > 0) {
          const { error } = await supabase
            .from("series")
            .upsert(insertable, { onConflict: "anilist_id" });
          if (error) throw new Error(`Upsert failed on page ${page}: ${error.message}`);
          imported += insertable.length;
        }
      }

      lastCompletedPage = page;
      totalItems += media.length;
      page++;

      // stay friendly with AniList rate limits (~90 req/min)
      await new Promise((r) => setTimeout(r, 700));
    }

    await supabase
      .from("sync_state")
      .upsert(
        {
          job_name: jobName,
          last_page: hasNextPage ? lastCompletedPage : 0,
          total_items: totalItems,
          status: hasNextPage ? "paused" : "completed",
          last_error: null,
        },
        { onConflict: "job_name" },
      );

    return new Response(
      JSON.stringify({
        success: true,
        pages_processed: lastCompletedPage - startPage + 1,
        from_page: startPage,
        to_page: lastCompletedPage,
        imported,
        has_more: hasNextPage,
        next_page: hasNextPage ? lastCompletedPage + 1 : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("sync_state")
      .upsert({ job_name: currentJob, status: "error", last_error: message }, { onConflict: "job_name" });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

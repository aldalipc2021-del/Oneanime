import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = username.trim();

    // Use Jikan API (public MAL proxy, no API key needed, no CORS issues server-side)
    const allAnime: any[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext && page <= 10) {
      const url = `https://api.jikan.moe/v4/users/${encodeURIComponent(trimmed)}/animelist?page=${page}&limit=25`;
      console.log(`Fetching page ${page}: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ error: `MyAnimeList Benutzer "${trimmed}" nicht gefunden. Bitte überprüfe deinen Benutzernamen auf myanimelist.net` }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 429) {
          // Rate limited - wait and retry
          console.log("Rate limited, waiting 2s...");
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        const text = await response.text();
        console.error(`Jikan API error: ${response.status} - ${text}`);
        return new Response(JSON.stringify({ error: "Fehler beim Abrufen der MyAnimeList Daten" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const data = result.data || [];
      allAnime.push(...data);

      hasNext = result.pagination?.has_next_page === true;
      page++;

      // Jikan rate limit: ~3 requests/sec
      if (hasNext) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    console.log(`Fetched ${allAnime.length} anime for user ${trimmed}`);

    // Transform to our format
    const animeList = allAnime.map((entry: any) => ({
      node: {
        id: entry.anime?.mal_id || entry.mal_id,
        title: entry.anime?.title || entry.title || "Unknown",
        main_picture: {
          large: entry.anime?.images?.jpg?.large_image_url,
          medium: entry.anime?.images?.jpg?.image_url,
        },
        num_episodes: entry.anime?.episodes || entry.episodes,
      },
      list_status: {
        status: mapJikanStatus(entry.watching_status || entry.status),
        num_episodes_watched: entry.episodes_watched || 0,
        notes: entry.notes || "",
      },
    }));

    return new Response(JSON.stringify({ data: animeList }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("MAL import error:", err);
    return new Response(JSON.stringify({ error: "Interner Serverfehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapJikanStatus(status: number | string): string {
  // Jikan uses numeric status: 1=watching, 2=completed, 3=on_hold, 4=dropped, 6=plan_to_watch
  const statusMap: Record<string | number, string> = {
    1: "watching",
    2: "completed",
    3: "on_hold",
    4: "dropped",
    6: "plan_to_watch",
    watching: "watching",
    completed: "completed",
    on_hold: "on_hold",
    dropped: "dropped",
    plan_to_watch: "plan_to_watch",
  };
  return statusMap[status] || "watching";
}

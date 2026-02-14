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

    // Use MAL's public JSON endpoint (status=7 means all statuses)
    const allAnime: any[] = [];
    let offset = 0;
    const limit = 300;

    while (offset < 3000) {
      const url = `https://myanimelist.net/animelist/${encodeURIComponent(trimmed)}/load.json?status=7&offset=${offset}`;
      console.log(`Fetching offset ${offset}: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OneAnime/1.0)",
        },
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          if (allAnime.length === 0) {
            return new Response(
              JSON.stringify({ error: `MyAnimeList Benutzer "${trimmed}" nicht gefunden oder Anime-Liste ist privat.` }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          break;
        }
        const text = await response.text();
        console.error(`MAL API error: ${response.status} - ${text}`);
        break;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      allAnime.push(...data);
      offset += limit;

      // Small delay to be respectful
      if (data.length >= limit) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        break;
      }
    }

    console.log(`Fetched ${allAnime.length} anime for user ${trimmed}`);

    // Transform to our format
    const animeList = allAnime.map((entry: any) => ({
      node: {
        id: entry.anime_id,
        title: entry.anime_title_eng || entry.anime_title || "Unknown",
        main_picture: {
          large: entry.anime_image_path?.replace("/r/192x272/", "/") || null,
          medium: entry.anime_image_path || null,
        },
        num_episodes: entry.anime_num_episodes || 0,
      },
      list_status: {
        status: mapMALStatus(entry.status),
        num_episodes_watched: entry.num_watched_episodes || 0,
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

function mapMALStatus(status: number): string {
  // MAL status: 1=watching, 2=completed, 3=on_hold, 4=dropped, 6=plan_to_watch
  const statusMap: Record<number, string> = {
    1: "watching",
    2: "completed",
    3: "on_hold",
    4: "dropped",
    6: "plan_to_watch",
  };
  return statusMap[status] || "watching";
}

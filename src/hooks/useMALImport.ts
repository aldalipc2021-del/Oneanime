import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { TrackingStatus } from "./useTracking";

interface MALAnimeEntry {
  node: {
    id: number;
    title: string;
    main_picture?: {
      medium?: string;
      large?: string;
    };
    num_episodes?: number;
  };
  list_status: {
    status: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
    num_episodes_watched: number;
    start_date?: string;
    finish_date?: string;
    notes?: string;
  };
}

export interface MALImportData {
  username: string;
}

export const useMALImport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MALImportData) => {
      if (!user) throw new Error("Nicht angemeldet");

      const username = data.username.trim();
      if (!username) throw new Error("MyAnimeList Benutzername ist erforderlich");

      // Fetch user's anime list from MAL
      // Using the official MyAnimeList API v2
      const response = await fetch(
        `https://api.myanimelist.net/v2/users/${username}/animelist?fields=list_status,node{id,title,main_picture,num_episodes}&limit=1000`,
        {
          headers: {
            "X-MAL-CLIENT-ID": process.env.VITE_MAL_CLIENT_ID || "",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("MyAnimeList Benutzer nicht gefunden");
        }
        throw new Error("Fehler beim Abrufen der MyAnimeList Daten");
      }

      const result = await response.json();
      const animeList: MALAnimeEntry[] = result.data || [];

      if (animeList.length === 0) {
        throw new Error("Keine Anime in der MyAnimeList Liste gefunden");
      }

      // Import anime to Supabase
      const { supabase } = await import("@/integrations/supabase/client");
      const importedAnime = [];
      const errors = [];

      for (const entry of animeList) {
        try {
          const malStatus = entry.list_status.status;

          // Map MAL status to our tracking status
          let status: TrackingStatus;
          switch (malStatus) {
            case "completed":
              status = "completed";
              break;
            case "plan_to_watch":
              status = "plan_to_watch";
              break;
            case "watching":
            case "on_hold":
            case "dropped":
            default:
              status = "watching";
              break;
          }

          const anime = entry.node;
          const imageUrl = anime.main_picture?.large || anime.main_picture?.medium;

          // Upsert the anime tracking entry
          const { error } = await supabase
            .from("anime_tracking")
            .upsert(
              {
                user_id: user.id,
                anime_id: anime.id,
                anime_title: anime.title,
                anime_image: imageUrl || null,
                total_episodes: anime.num_episodes || null,
                status,
                current_episode: entry.list_status.num_episodes_watched || 0,
                notes: entry.list_status.notes || null,
              },
              {
                onConflict: "user_id,anime_id",
              }
            );

          if (error) {
            errors.push({
              title: anime.title,
              reason: error.message,
            });
          } else {
            importedAnime.push(anime.title);
          }
        } catch (err) {
          errors.push({
            title: entry.node.title,
            reason: String(err),
          });
        }
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["trackedAnime"] });

      return {
        imported: importedAnime.length,
        failed: errors.length,
        errors,
      };
    },
    onSuccess: (result) => {
      if (result.imported > 0) {
        toast({
          title: "Import erfolgreich",
          description: `${result.imported} Anime importiert${
            result.failed > 0 ? `, ${result.failed} Fehler` : ""
          }`,
        });
      }

      if (result.failed > 0) {
        console.error("Import errors:", result.errors);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import fehlgeschlagen",
        description: error.message || "Beim Importieren ist ein Fehler aufgetreten",
        variant: "destructive",
      });
    },
  });
};

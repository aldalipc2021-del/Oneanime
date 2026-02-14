import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { TrackingStatus } from "./useTracking";
import { supabase } from "@/integrations/supabase/client";

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

      // Call our edge function to avoid CORS issues
      const { data: result, error } = await supabase.functions.invoke("mal-import", {
        body: { username },
      });

      if (error) {
        throw new Error(error.message || "Fehler beim Abrufen der MyAnimeList Daten");
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      const animeList: MALAnimeEntry[] = result?.data || [];

      if (animeList.length === 0) {
        throw new Error("Keine Anime in der MyAnimeList Liste gefunden");
      }

      // Import anime to Supabase
      const importedAnime: string[] = [];
      const errors: { title: string; reason: string }[] = [];

      for (const entry of animeList) {
        try {
          const malStatus = entry.list_status.status;

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

          const { error: upsertError } = await supabase
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

          if (upsertError) {
            errors.push({ title: anime.title, reason: upsertError.message });
          } else {
            importedAnime.push(anime.title);
          }
        } catch (err) {
          errors.push({ title: entry.node.title, reason: String(err) });
        }
      }

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

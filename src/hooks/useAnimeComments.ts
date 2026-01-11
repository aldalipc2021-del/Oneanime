import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AnimeComment {
  id: string;
  anime_id: number;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// List of forbidden words (German and English)
const forbiddenWords = [
  // German
  "arschloch", "scheiße", "scheisse", "fick", "ficken", "hurensohn", "wichser",
  "missgeburt", "behindert", "spast", "schwuchtel", "fotze", "hure", "nutte",
  "vollidiot", "idiot", "dumm", "dummkopf", "penner", "assi", "asi",
  // English
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt",
  "retard", "idiot", "stupid", "dumb", "moron", "nigger", "faggot"
];

// Check if content contains forbidden words
export const containsForbiddenWords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return forbiddenWords.some(word => lowerText.includes(word));
};

// Get comments for an anime
export const useAnimeComments = (animeId: number) => {
  return useQuery({
    queryKey: ["animeComments", animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime_comments")
        .select("*")
        .eq("anime_id", animeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnimeComment[];
    },
    enabled: !!animeId,
  });
};

// Add a comment
export const useAddAnimeComment = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      animeId,
      content,
    }: {
      animeId: number;
      content: string;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");
      
      // Check for forbidden words
      if (containsForbiddenWords(content)) {
        throw new Error("Dein Kommentar enthält unangemessene Sprache. Bitte formuliere ihn um.");
      }

      const displayName = profile?.display_name || user.email?.split("@")[0] || "Anonym";

      const { data, error } = await supabase
        .from("anime_comments")
        .insert({
          user_id: user.id,
          anime_id: animeId,
          display_name: displayName,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["animeComments", variables.animeId] });
    },
  });
};

// Delete own comment
export const useDeleteAnimeComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      animeId,
    }: {
      commentId: string;
      animeId: number;
    }) => {
      if (!user) throw new Error("Nicht angemeldet");

      const { error } = await supabase
        .from("anime_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["animeComments", variables.animeId] });
    },
  });
};

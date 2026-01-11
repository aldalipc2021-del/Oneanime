import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnimeComments, useAddAnimeComment, useDeleteAnimeComment, containsForbiddenWords } from "@/hooks/useAnimeComments";
import { useAnimeAverageRating, useUserAnimeRating, useSetAnimeRating } from "@/hooks/useAnimeRatings";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Send, Trash2, Star, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AnimeCommentsSectionProps {
  animeId: number;
  imdbScore?: number;
}

export const AnimeCommentsSection = ({ animeId, imdbScore }: AnimeCommentsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const { data: comments, isLoading: commentsLoading } = useAnimeComments(animeId);
  const { data: averageRating, isLoading: ratingLoading } = useAnimeAverageRating(animeId);
  const { data: userRating } = useUserAnimeRating(animeId);
  
  const addComment = useAddAnimeComment();
  const deleteComment = useDeleteAnimeComment();
  const setRating = useSetAnimeRating();

  const handleCommentChange = (value: string) => {
    setNewComment(value);
    if (containsForbiddenWords(value)) {
      setCommentError("Dein Kommentar enthält unangemessene Sprache.");
    } else {
      setCommentError(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment.mutateAsync({
        animeId,
        content: newComment,
      });
      setNewComment("");
      setCommentError(null);
      toast({
        title: "Kommentar hinzugefügt",
        description: "Dein Kommentar wurde erfolgreich gepostet.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Konnte Kommentar nicht posten.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, animeId });
      toast({
        title: "Kommentar gelöscht",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Kommentar nicht löschen.",
        variant: "destructive",
      });
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um zu bewerten.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setRating.mutateAsync({ animeId, rating });
      toast({
        title: "Bewertung gespeichert",
        description: `Du hast ${rating} Sterne vergeben.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Bewertung nicht speichern.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <MessageCircle className="h-6 w-6 text-primary" />
        Bewertungen & Kommentare
      </h2>

      {/* Ratings Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {/* IMDB Rating */}
        {imdbScore && imdbScore > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>IMDb Bewertung</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">{imdbScore.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 10</span>
            </div>
          </div>
        )}

        {/* OneAnime Rating */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>OneAnime Bewertung</span>
            {averageRating && averageRating.count > 0 && (
              <span className="text-xs">({averageRating.count} Bewertungen)</span>
            )}
          </div>
          {ratingLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                {averageRating && averageRating.count > 0 
                  ? averageRating.average.toFixed(1) 
                  : "—"}
              </span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          )}
        </div>
      </div>

      {/* User Rating */}
      <div className="mb-8 rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {user ? "Deine Bewertung:" : "Melde dich an, um zu bewerten:"}
        </p>
        <StarRating
          value={userRating?.rating || 0}
          onChange={handleRatingChange}
          readonly={!user || setRating.isPending}
          size="lg"
        />
      </div>

      {/* Add Comment */}
      {user ? (
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <Textarea
            placeholder="Schreibe einen Kommentar..."
            value={newComment}
            onChange={(e) => handleCommentChange(e.target.value)}
            className={cn(
              "mb-3 min-h-[80px]",
              commentError && "border-destructive"
            )}
          />
          {commentError && (
            <p className="mb-3 text-sm text-destructive">{commentError}</p>
          )}
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || !!commentError || addComment.isPending}
            className="gap-2"
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Kommentar posten
          </Button>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-card/50 p-4 text-center text-muted-foreground">
          Melde dich an, um einen Kommentar zu schreiben.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {comment.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{comment.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: de })}
                  </span>
                </div>
                {user && user.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-foreground/90">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Noch keine Kommentare. Sei der Erste!
          </div>
        )}
      </div>
    </section>
  );
};

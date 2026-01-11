import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Film, 
  Loader2, 
  Star,
  Eye,
  EyeOff
} from "lucide-react";

interface Episode {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  title_romanji?: string | null;
  aired: string | null;
  score?: number;
  filler: boolean;
  recap: boolean;
}

interface EpisodeListProps {
  episodes: Episode[];
  isLoading: boolean;
  totalEpisodes: number | null;
  watchedEpisodes?: Set<number>;
  onToggleEpisodeWatched?: (episodeNumber: number) => void;
  onMarkAllWatched?: () => void;
  onMarkAllUnwatched?: () => void;
  isMarkingWatched?: boolean;
  seasonTitle?: string;
  seasonNumber?: number;
}

export const EpisodeList = ({
  episodes,
  isLoading,
  totalEpisodes,
  watchedEpisodes = new Set(),
  onToggleEpisodeWatched,
  onMarkAllWatched,
  onMarkAllUnwatched,
  isMarkingWatched,
  seasonTitle,
  seasonNumber,
}: EpisodeListProps) => {
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const [showFillerRecap, setShowFillerRecap] = useState(true);

  // Filter episodes based on filler/recap toggle
  const filteredEpisodes = useMemo(() => {
    if (showFillerRecap) return episodes;
    return episodes.filter(ep => !ep.filler && !ep.recap);
  }, [episodes, showFillerRecap]);

  const displayedEpisodes = filteredEpisodes.slice(0, displayCount);
  const hasMore = displayCount < filteredEpisodes.length;

  const watchedCount = Array.from(watchedEpisodes).filter(ep => ep <= episodes.length).length;
  const episodeCount = episodes.length || totalEpisodes || 0;
  const fillerCount = episodes.filter(ep => ep.filler).length;
  const recapCount = episodes.filter(ep => ep.recap).length;

  // Get display title for episode
  const getEpisodeTitle = (episode: Episode, index: number) => {
    // Prefer German title if available through romanji (sometimes contains localized names)
    // Otherwise use the main title
    return episode.title || `Episode ${index + 1}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Button
        variant="secondary"
        onClick={() => setShowEpisodes(!showEpisodes)}
        className="mb-4 w-full justify-between gap-2 md:w-auto"
      >
        <span className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          {seasonNumber ? `Staffel ${seasonNumber}` : seasonTitle || "Episoden"}
          <span className="text-muted-foreground">
            ({isLoading ? "..." : episodeCount})
          </span>
          {watchedCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
              {watchedCount}/{episodeCount}
            </span>
          )}
        </span>
        {showEpisodes ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showEpisodes && (
        <div className="animate-fade-in rounded-xl border border-border bg-card">
          {/* Filter controls */}
          {(fillerCount > 0 || recapCount > 0) && (
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="text-sm text-muted-foreground">
                {fillerCount > 0 && (
                  <span className="mr-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1" />
                    {fillerCount} Filler
                  </span>
                )}
                {recapCount > 0 && (
                  <span>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1" />
                    {recapCount} Recap
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFillerRecap(!showFillerRecap)}
                className="text-xs"
              >
                {showFillerRecap ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Filler ausblenden
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Alle anzeigen
                  </>
                )}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-32 items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">
                Episoden werden geladen...
              </span>
            </div>
          ) : episodes.length > 0 ? (
            <>
              <div className="max-h-[600px] overflow-y-auto">
                {displayedEpisodes.map((episode, displayIndex) => {
                  // Find the original episode number
                  const originalIndex = episodes.findIndex(ep => ep.mal_id === episode.mal_id);
                  const episodeNumber = originalIndex >= 0 ? originalIndex + 1 : displayIndex + 1;
                  const isWatched = watchedEpisodes.has(episodeNumber);
                  
                  return (
                    <div
                      key={episode.mal_id || displayIndex}
                      className={cn(
                        "flex items-center gap-4 p-4 transition-colors",
                        displayIndex !== displayedEpisodes.length - 1 &&
                          "border-b border-border",
                        isWatched && "bg-primary/5"
                      )}
                    >
                      {/* Episode Watch Toggle */}
                      {onToggleEpisodeWatched && (
                        <button
                          onClick={() => onToggleEpisodeWatched(episodeNumber)}
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all",
                            isWatched
                              ? "bg-primary text-primary-foreground hover:bg-primary/80"
                              : episode.filler
                              ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"
                              : episode.recap
                              ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                              : "bg-secondary hover:bg-secondary/80"
                          )}
                          title={isWatched ? "Als ungesehen markieren" : "Als gesehen markieren"}
                        >
                          {isWatched ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{episodeNumber}</span>
                          )}
                        </button>
                      )}
                      
                      {!onToggleEpisodeWatched && (
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                            isWatched
                              ? "bg-primary text-primary-foreground"
                              : episode.filler
                              ? "bg-orange-500/20 text-orange-500"
                              : episode.recap
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-secondary"
                          )}
                        >
                          {isWatched ? <Check className="h-5 w-5" /> : episodeNumber}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium text-foreground">
                          {getEpisodeTitle(episode, originalIndex >= 0 ? originalIndex : displayIndex)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          {episode.aired && (
                            <span>
                              {new Date(episode.aired).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          )}
                          {episode.filler && (
                            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-orange-500 font-medium">
                              Filler
                            </span>
                          )}
                          {episode.recap && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-500 font-medium">
                              Recap
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {episode.score && episode.score > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {episode.score.toFixed(1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="border-t border-border p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDisplayCount((prev) => prev + 50)}
                  >
                    Mehr laden ({filteredEpisodes.length - displayCount} weitere)
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-border p-4 flex flex-wrap gap-3">
                {onMarkAllWatched && episodes.length > 0 && watchedCount < episodeCount && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={onMarkAllWatched}
                    disabled={isMarkingWatched}
                  >
                    {isMarkingWatched ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Alle als gesehen markieren
                  </Button>
                )}
                {onMarkAllUnwatched && watchedCount > 0 && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={onMarkAllUnwatched}
                    disabled={isMarkingWatched}
                  >
                    <EyeOff className="h-4 w-4" />
                    Alle als ungesehen
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Keine Episodeninformationen verfügbar</p>
              <p className="text-sm mt-1">
                Dieser Anime hat möglicherweise {totalEpisodes || "unbekannte"} Episoden
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

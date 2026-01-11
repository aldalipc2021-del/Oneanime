import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Film, Loader2, Tv, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SeasonEntry } from "@/hooks/useAnimeSeasons";

interface SeasonSelectorProps {
  seasons: SeasonEntry[];
  films?: SeasonEntry[];
  selectedSeasonId: number;
  onSelectSeason: (id: number, isFilm?: boolean) => void;
  currentAnimeId: number;
  isLoading?: boolean;
  includeFilmsAsSeason?: boolean;
  onRefresh?: () => void;
}

export const SeasonSelector = ({
  seasons,
  films = [],
  selectedSeasonId,
  onSelectSeason,
  currentAnimeId,
  isLoading,
  includeFilmsAsSeason = false,
  onRefresh,
}: SeasonSelectorProps) => {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Staffeln werden geladen...</span>
      </div>
    );
  }

  const hasMultipleSeasons = seasons && seasons.length > 1;
  const hasFilms = films && films.length > 0;
  
  if (!hasMultipleSeasons && !hasFilms) {
    return null;
  }

  // Find current selection
  const selectedSeasonIndex = seasons.findIndex(s => s.mal_id === selectedSeasonId);
  const selectedSeason = seasons.find(s => s.mal_id === selectedSeasonId);
  const isFilmSelected = films.some(f => f.mal_id === selectedSeasonId);
  const selectedFilm = films.find(f => f.mal_id === selectedSeasonId);

  const getSeasonDisplayName = (season: SeasonEntry, index: number) => {
    const seasonNumber = index + 1;
    return `Staffel ${seasonNumber}`;
  };

  const getSeasonSubtitle = (season: SeasonEntry) => {
    // Try to get a meaningful subtitle from the title
    const title = season.title_english || season.title;
    // Remove common prefixes that match the main anime title
    if (title) {
      // Look for season indicators in the title
      const seasonMatch = title.match(/(?:Season|Part|Cour|Arc)\s*(\d+|[IVX]+)/i);
      if (seasonMatch) {
        return seasonMatch[0];
      }
      // If title is significantly different, show it
      return title;
    }
    return null;
  };

  const currentDisplay = isFilmSelected 
    ? `Film: ${selectedFilm?.title_english || selectedFilm?.title || "Film"}`
    : selectedSeasonIndex >= 0 
      ? getSeasonDisplayName(selectedSeason!, selectedSeasonIndex)
      : "Staffel auswählen";

  const handleSelect = (id: number, isFilm: boolean = false) => {
    onSelectSeason(id, isFilm);
    setOpen(false);
  };

  // Calculate total episodes across all seasons
  const totalSeasonEpisodes = seasons.reduce((sum, s) => sum + (s.episodes || 0), 0);

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between gap-2 md:w-auto min-w-[280px]"
      >
        <span className="flex items-center gap-2">
          {isFilmSelected ? (
            <Film className="h-4 w-4" />
          ) : (
            <Tv className="h-4 w-4" />
          )}
          <span className="truncate">{currentDisplay}</span>
          {seasons.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({seasons.length} Staffeln)
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Staffel auswählen</DialogTitle>
              {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            {totalSeasonEpisodes > 0 && (
              <p className="text-sm text-muted-foreground">
                {seasons.length} Staffeln • {totalSeasonEpisodes} Episoden gesamt
              </p>
            )}
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1 pr-4">
              {/* Seasons */}
              {seasons.map((season, index) => {
                const isSelected = season.mal_id === selectedSeasonId;
                const seasonNumber = index + 1;
                const subtitle = getSeasonSubtitle(season);
                const year = season.aired?.from 
                  ? new Date(season.aired.from).getFullYear() 
                  : null;
                
                return (
                  <button
                    key={season.mal_id}
                    onClick={() => handleSelect(season.mal_id, false)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold",
                      isSelected 
                        ? "bg-primary-foreground/20" 
                        : "bg-secondary"
                    )}>
                      {seasonNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Staffel {seasonNumber}
                      </p>
                      {subtitle && subtitle !== season.title && (
                        <p className={cn(
                          "text-sm line-clamp-1",
                          isSelected 
                            ? "text-primary-foreground/80" 
                            : "text-foreground/70"
                        )}>
                          {subtitle}
                        </p>
                      )}
                      <p className={cn(
                        "text-xs mt-0.5",
                        isSelected 
                          ? "text-primary-foreground/60" 
                          : "text-muted-foreground"
                      )}>
                        {season.episodes ? `${season.episodes} Episoden` : "Episoden werden geladen..."}
                        {year && ` • ${year}`}
                        {season.type && season.type !== "TV" && ` • ${season.type}`}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Films Section */}
              {includeFilmsAsSeason && hasFilms && (
                <>
                  <div className="my-4 border-t border-border pt-4">
                    <p className="mb-3 px-3 text-sm font-semibold text-foreground flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Filme ({films.length})
                    </p>
                  </div>
                  {films.map((film, index) => {
                    const isSelected = film.mal_id === selectedSeasonId;
                    const year = film.aired?.from 
                      ? new Date(film.aired.from).getFullYear() 
                      : null;
                    
                    return (
                      <button
                        key={film.mal_id}
                        onClick={() => handleSelect(film.mal_id, true)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        )}
                      >
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden",
                          isSelected 
                            ? "bg-primary-foreground/20" 
                            : "bg-secondary"
                        )}>
                          {film.images?.jpg?.image_url ? (
                            <img 
                              src={film.images.jpg.image_url} 
                              alt={film.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Film className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium line-clamp-1">
                            {film.title_english || film.title}
                          </p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            isSelected 
                              ? "text-primary-foreground/60" 
                              : "text-muted-foreground"
                          )}>
                            {film.type} {year && `• ${year}`}
                          </p>
                          {film.watchAfterSeason && (
                            <p className={cn(
                              "text-xs mt-1 italic",
                              isSelected 
                                ? "text-primary-foreground/70" 
                                : "text-primary/70"
                            )}>
                              💡 Nach Staffel {film.watchAfterSeason} schauen
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

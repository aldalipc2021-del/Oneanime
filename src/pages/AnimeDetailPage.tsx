import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  useAnimeById, 
  useAnimeRecommendations,
  getDisplayTitle 
} from "@/hooks/useAniListApi";
import { useAnimeSeasons, useAllAnimeEpisodes, calculateTotalEpisodes } from "@/hooks/useAnimeSeasons";
import { useAuth } from "@/hooks/useAuth";
import { useTrackingStatus, useAddTracking, useUpdateTracking, TrackingStatus } from "@/hooks/useTracking";
import { useAnimeStreamingLinks, streamingServiceInfo } from "@/hooks/useStreamingServices";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimeCard } from "@/components/AnimeCard";
import { AnimeCommentsSection } from "@/components/AnimeCommentsSection";
import { SeasonSelector } from "@/components/SeasonSelector";
import { EpisodeList } from "@/components/EpisodeList";
import { 
  Star, 
  Calendar, 
  Clock, 
  Play, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Check,
  Loader2,
  Tv,
  Minus,
  Save,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AnimeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { user, profile } = useAuth();
  const { data: anime, isLoading: animeLoading } = useAnimeById(animeId);
  
  // Get films setting from localStorage
  const [includeFilmsAsSeason, setIncludeFilmsAsSeason] = useState(() => {
    const saved = localStorage.getItem("includeFilmsAsSeason");
    return saved === "true";
  });
  
  const { data: seasonsData, isLoading: seasonsLoading } = useAnimeSeasons(animeId, includeFilmsAsSeason);
  const seasons = seasonsData?.seasons || [];
  const films = seasonsData?.films || [];
  
  const { data: recommendations } = useAnimeRecommendations(animeId);
  const { data: tracking, isLoading: trackingLoading } = useTrackingStatus(animeId);
  const { data: streamingLinks, isLoading: streamingLoading } = useAnimeStreamingLinks(
    animeId,
    anime?._streamingEpisodes,
    anime?._externalLinks
  );
  const { translateText, isTranslating, currentLanguage } = useTranslation();
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(animeId);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());

  // Update selected season when animeId changes
  useEffect(() => {
    setSelectedSeasonId(animeId);
  }, [animeId]);

  // Get selected season data
  const selectedSeason = seasons.find(s => s.mal_id === selectedSeasonId) || 
                         films.find(f => f.mal_id === selectedSeasonId) ||
                         anime;
  const selectedSeasonIndex = seasons.findIndex(s => s.mal_id === selectedSeasonId);
  const isFilmSelected = films.some(f => f.mal_id === selectedSeasonId);

  // Fetch episodes for selected season
  const { data: episodes, isLoading: episodesLoading } = useAllAnimeEpisodes(
    selectedSeasonId,
    !!selectedSeasonId && !isFilmSelected
  );

  const addTracking = useAddTracking();
  const updateTracking = useUpdateTracking();

  // Calculate total episodes across all seasons
  const totalEpisodesAllSeasons = useMemo(() => {
    return calculateTotalEpisodes(seasons);
  }, [seasons]);

  // Load watched episodes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`watchedEpisodes_${animeId}`);
    if (saved) {
      setWatchedEpisodes(new Set(JSON.parse(saved)));
    } else {
      setWatchedEpisodes(new Set());
    }
  }, [animeId]);

  // Translate synopsis when language changes or anime loads
  useEffect(() => {
    const translateSynopsis = async () => {
      if (anime?.synopsis && currentLanguage !== "en" && currentLanguage !== "ja") {
        const translated = await translateText(anime.synopsis);
        setTranslatedSynopsis(translated);
      }
    };
    translateSynopsis();
  }, [anime?.synopsis, currentLanguage, translateText]);

  if (animeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Anime nicht gefunden</p>
      </div>
    );
  }

  const title = getDisplayTitle(anime);

  const handleTrack = async (status: TrackingStatus) => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um Anime zu tracken.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      await addTracking.mutateAsync({
        animeId,
        animeTitle: title,
        animeImage: anime.images.webp.large_image_url || anime.images.jpg.large_image_url,
        totalEpisodes: totalEpisodesAllSeasons || anime.episodes || undefined,
        status,
      });
      
      toast({
        title: "Erfolgreich hinzugefügt",
        description: `${title} wurde zu deiner Liste hinzugefügt.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Anime nicht tracken.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEpisodeWatched = async (episodeNumber: number) => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich an, um Episoden zu markieren.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const newWatched = new Set(watchedEpisodes);
    if (newWatched.has(episodeNumber)) {
      newWatched.delete(episodeNumber);
    } else {
      newWatched.add(episodeNumber);
    }
    setWatchedEpisodes(newWatched);
    localStorage.setItem(`watchedEpisodes_${animeId}`, JSON.stringify(Array.from(newWatched)));

    const totalWatched = newWatched.size;
    
    if (tracking) {
      const totalEps = totalEpisodesAllSeasons || tracking.total_episodes || anime.episodes || 0;
      const newStatus = totalWatched >= totalEps && totalEps > 0 ? "completed" : "watching";
      
      try {
        await updateTracking.mutateAsync({
          animeId,
          updates: { 
            current_episode: totalWatched,
            status: newStatus,
          },
        });
      } catch (error) {
        console.error("Failed to update tracking:", error);
      }
    } else {
      try {
        await addTracking.mutateAsync({
          animeId,
          animeTitle: title,
          animeImage: anime.images.webp.large_image_url || anime.images.jpg.large_image_url,
          totalEpisodes: totalEpisodesAllSeasons || anime.episodes || undefined,
          status: "watching",
        });
      } catch (error) {
        console.error("Failed to add tracking:", error);
      }
    }
  };

  const handleMarkAllWatched = async () => {
    if (!tracking) return;
    const episodeCount = episodes?.length || selectedSeason?.episodes || 0;
    if (!episodeCount) return;
    
    const allEpisodes = new Set<number>();
    for (let i = 1; i <= episodeCount; i++) {
      allEpisodes.add(i);
    }
    
    const newWatched = new Set([...watchedEpisodes, ...allEpisodes]);
    setWatchedEpisodes(newWatched);
    localStorage.setItem(`watchedEpisodes_${animeId}`, JSON.stringify(Array.from(newWatched)));

    const totalEps = totalEpisodesAllSeasons || tracking.total_episodes || anime.episodes || 0;
    const newStatus = newWatched.size >= totalEps && totalEps > 0 ? "completed" : "watching";
    
    try {
      await updateTracking.mutateAsync({
        animeId,
        updates: { 
          current_episode: newWatched.size,
          status: newStatus,
        },
      });
      
      toast({
        title: "Staffel markiert",
        description: `${episodeCount} Episoden als gesehen markiert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Staffel nicht markieren.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllUnwatched = async () => {
    if (!tracking) return;
    
    setWatchedEpisodes(new Set());
    localStorage.setItem(`watchedEpisodes_${animeId}`, JSON.stringify([]));

    try {
      await updateTracking.mutateAsync({
        animeId,
        updates: { 
          current_episode: 0,
          status: "watching",
        },
      });
      
      toast({
        title: "Zurückgesetzt",
        description: "Alle Episoden als ungesehen markiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!tracking) return;
    
    try {
      await updateTracking.mutateAsync({
        animeId,
        updates: { notes },
      });
      
      toast({
        title: "Notizen gespeichert",
      });
      setShowNotes(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte Notizen nicht speichern.",
        variant: "destructive",
      });
    }
  };

  const handleSeasonSelect = (seasonId: number, isFilm?: boolean) => {
    setSelectedSeasonId(seasonId);
    if (seasonId !== animeId) {
      navigate(`/anime/${seasonId}`);
    }
  };

  const currentStatus = tracking?.status;

  const getSeasonTitle = () => {
    if (isFilmSelected) {
      const film = films.find(f => f.mal_id === selectedSeasonId);
      return film?.title_english || film?.title || "Film";
    }
    if (!seasons || seasons.length <= 1) return undefined;
    return `Staffel ${selectedSeasonIndex + 1}`;
  };

  const progressWatched = watchedEpisodes.size;
  const progressTotal = totalEpisodesAllSeasons || anime.episodes || 0;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section with Background */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 h-[500px]">
          <img
            src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/60" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            {/* Poster */}
            <div className="shrink-0">
              <div className="relative mx-auto w-48 overflow-hidden rounded-xl shadow-2xl md:w-64">
                <img
                  src={selectedSeason?.images?.webp?.large_image_url || 
                       selectedSeason?.images?.jpg?.large_image_url ||
                       anime.images.webp.large_image_url || 
                       anime.images.jpg.large_image_url}
                  alt={title}
                  className="w-full"
                />
                {seasons.length > 1 && selectedSeasonIndex >= 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-center text-sm font-semibold text-white">
                      Staffel {selectedSeasonIndex + 1}
                    </p>
                  </div>
                )}
                {tracking && progressTotal > 0 && (
                  <div className="absolute top-2 right-2 rounded-lg bg-black/70 px-2 py-1">
                    <span className="text-xs font-bold text-white">
                      {progressWatched}/{progressTotal}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
              {anime.title_japanese && (
                <p className="mb-4 text-lg text-muted-foreground">{anime.title_japanese}</p>
              )}

              <SeasonSelector
                seasons={seasons}
                films={films}
                selectedSeasonId={selectedSeasonId}
                onSelectSeason={handleSeasonSelect}
                currentAnimeId={animeId}
                isLoading={seasonsLoading}
                includeFilmsAsSeason={includeFilmsAsSeason}
              />

              {/* Meta Info */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
                {anime.score > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold text-primary">{anime.score.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({(anime.scored_by / 1000).toFixed(0)}k Bewertungen)
                    </span>
                  </div>
                )}
                
                {progressTotal > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Tv className="h-4 w-4" />
                    <span>{progressTotal} Episoden gesamt</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{anime.aired?.string || "TBA"}</span>
                </div>
                
                {anime.duration && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{anime.duration}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="mb-6 flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span
                    key={genre.mal_id}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Tracking Buttons */}
              <div className="mb-6 flex flex-wrap gap-3">
                <Button 
                  variant={currentStatus === "watching" ? "default" : "outline"}
                  onClick={() => handleTrack("watching")}
                  className="gap-2"
                  disabled={addTracking.isPending}
                >
                  {currentStatus === "watching" ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  Am schauen
                </Button>
                <Button 
                  variant={currentStatus === "completed" ? "default" : "outline"}
                  onClick={() => handleTrack("completed")}
                  className="gap-2"
                  disabled={addTracking.isPending}
                >
                  <Check className="h-4 w-4" />
                  Abgeschlossen
                </Button>
                <Button 
                  variant={currentStatus === "plan_to_watch" ? "default" : "outline"}
                  onClick={() => handleTrack("plan_to_watch")}
                  className="gap-2"
                  disabled={addTracking.isPending}
                >
                  {currentStatus === "plan_to_watch" ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Plane zu schauen
                </Button>
              </div>

              {/* Progress Display */}
              {tracking && progressTotal > 0 && (
                <div className="mb-6 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fortschritt:</span>
                    <span className="font-semibold">
                      {progressWatched} / {progressTotal} Episoden
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min((progressWatched / progressTotal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-right">
                    {Math.round((progressWatched / progressTotal) * 100)}% abgeschlossen
                  </p>
                </div>
              )}

              {/* Synopsis */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Beschreibung</h2>
                  {translatedSynopsis && translatedSynopsis !== anime.synopsis && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="gap-2 text-xs"
                    >
                      <Languages className="h-3 w-3" />
                      {showOriginal ? "Übersetzung" : "Original"}
                    </Button>
                  )}
                </div>
                <p className="leading-relaxed text-muted-foreground line-clamp-3 md:line-clamp-none">
                  {isTranslating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Übersetze...
                    </span>
                  ) : showOriginal ? (
                    anime.synopsis || "Keine Beschreibung verfügbar."
                  ) : (
                    translatedSynopsis || anime.synopsis || "Keine Beschreibung verfügbar."
                  )}
                </p>
              </div>

              {/* Streaming Services */}
              {streamingLinks && streamingLinks.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Verfügbar auf</h3>
                  <div className="flex flex-wrap gap-2">
                    {streamingLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
                      >
                        <span>{streamingServiceInfo[link.name]?.logo || "📺"}</span>
                        {link.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* IMDb Button */}
              <Button variant="outline" className="gap-2" asChild>
                <a 
                  href={`https://www.imdb.com/find?q=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  IMDb-Rezensionen ansehen
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Notes Section */}
      {tracking && (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <Button
            variant="secondary"
            onClick={() => {
              setNotes(tracking.notes || "");
              setShowNotes(!showNotes);
            }}
            className="mb-4 w-full justify-between gap-2 md:w-auto"
          >
            <span>Notizen / Kommentare</span>
            {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showNotes && (
            <div className="animate-fade-in rounded-xl border border-border bg-card p-4">
              <Textarea
                placeholder="Deine Notizen zu diesem Anime..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4 min-h-[100px]"
              />
              <Button onClick={handleSaveNotes} className="gap-2">
                <Save className="h-4 w-4" />
                Speichern
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Episodes Section */}
      {!isFilmSelected && (
        <EpisodeList
          episodes={episodes || []}
          isLoading={episodesLoading}
          totalEpisodes={selectedSeason?.episodes || anime.episodes}
          watchedEpisodes={watchedEpisodes}
          onToggleEpisodeWatched={user ? handleToggleEpisodeWatched : undefined}
          onMarkAllWatched={tracking ? handleMarkAllWatched : undefined}
          onMarkAllUnwatched={tracking ? handleMarkAllUnwatched : undefined}
          isMarkingWatched={updateTracking.isPending}
          seasonTitle={getSeasonTitle()}
          seasonNumber={selectedSeasonIndex >= 0 ? selectedSeasonIndex + 1 : undefined}
        />
      )}

      {/* Film Detail */}
      {isFilmSelected && selectedSeason && (
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-bold mb-4">
              {selectedSeason.title_english || selectedSeason.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {selectedSeason.aired?.from && (
                <span>Erschienen: {new Date(selectedSeason.aired.from).getFullYear()}</span>
              )}
            </div>
            <div className="rounded-lg bg-secondary/50 p-4 mb-4">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Star className="h-4 w-4" />
                Tipp zur Watch-Order
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Schau diesen Film nach der Hauptserie oder informiere dich über die empfohlene Reihenfolge.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Additional Info */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {anime.studios?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Studios</h3>
              <p className="text-foreground">{anime.studios.map(s => s.name).join(", ")}</p>
            </div>
          )}
          
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Quelle</h3>
            <p className="text-foreground">{anime.source || "Original"}</p>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Altersfreigabe</h3>
            <p className="text-foreground">{anime.rating || "Unbekannt"}</p>
          </div>
        </div>
      </section>

      {/* Comments and Ratings Section */}
      <AnimeCommentsSection animeId={animeId} imdbScore={anime.score} />

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <h2 className="mb-6 text-2xl font-bold">Ähnliche Anime</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recommendations.slice(0, 6).map((rec: any, index: number) => (
              <AnimeCard
                key={rec.entry.mal_id}
                id={rec.entry.mal_id}
                title={getDisplayTitle(rec.entry)}
                image={rec.entry.images.webp.large_image_url || rec.entry.images.jpg.large_image_url}
                index={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AnimeDetailPage;

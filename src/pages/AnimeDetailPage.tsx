import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSeriesByAnilistId, useDBSeasons, useDBEpisodes, getDisplayTitle, useEnsureDetailSync } from "@/hooks/useAnimeDB";
import { useAuth } from "@/hooks/useAuth";
import { useTrackingStatus, useAddTracking, useUpdateTracking, TrackingStatus } from "@/hooks/useTracking";
import {
  useAllEpisodeProgress,
  useToggleEpisodeProgress,
  useMarkAllEpisodesWatched,
  useMarkAllEpisodesUnwatched,
  useMigrateLocalEpisodeProgress,
} from "@/hooks/useEpisodeProgress";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimeCommentsSection } from "@/components/AnimeCommentsSection";
import { 
  Star, Calendar, Clock, Play, Plus, ChevronDown, ChevronUp,
  ExternalLink, Check, Loader2, Tv, Save, Languages, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


const AnimeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || "0");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { user, profile } = useAuth();
  const { data: series, isLoading: seriesLoading } = useSeriesByAnilistId(animeId);
  const { data: seasons, isLoading: seasonsLoading } = useDBSeasons(series?.id);
  const { isSyncing: detailSyncing } = useEnsureDetailSync(
    animeId,
    series?.id,
    !!seasons && seasons.length > 0,
    !!series && !seasonsLoading,
  );
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const { data: episodes, isLoading: episodesLoading } = useDBEpisodes(selectedSeasonId || undefined);
  
  const { data: tracking } = useTrackingStatus(animeId);
  const { translateText, isTranslating, currentLanguage } = useTranslation();
  
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  // Select first season by default
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  // Reset when anime changes
  useEffect(() => {
    setSelectedSeasonId(null);
    setTranslatedSynopsis(null);
  }, [animeId]);

  // Load watched episodes
  useEffect(() => {
    const saved = localStorage.getItem(`watchedEpisodes_${animeId}`);
    if (saved) setWatchedEpisodes(new Set(JSON.parse(saved)));
    else setWatchedEpisodes(new Set());
  }, [animeId]);

  // Translate synopsis
  useEffect(() => {
    const go = async () => {
      if (series?.description && currentLanguage !== "en" && currentLanguage !== "ja") {
        const translated = await translateText(series.description);
        setTranslatedSynopsis(translated);
      }
    };
    go();
  }, [series?.description, currentLanguage, translateText]);

  const addTracking = useAddTracking();
  const updateTracking = useUpdateTracking();

  const totalEpisodes = useMemo(() => {
    return (seasons || []).reduce((sum, s) => sum + (s.episode_count || 0), 0);
  }, [seasons]);

  const selectedSeason = seasons?.find(s => s.id === selectedSeasonId);

  if (seriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Anime nicht gefunden</p>
      </div>
    );
  }

  const title = series.title_en || series.title;

  const handleTrack = async (status: TrackingStatus) => {
    if (!user) {
      toast({ title: "Anmeldung erforderlich", variant: "destructive" });
      navigate("/auth");
      return;
    }
    try {
      await addTracking.mutateAsync({
        animeId,
        animeTitle: title,
        animeImage: series.cover_image || "/placeholder.svg",
        totalEpisodes: totalEpisodes || undefined,
        status,
      });
      toast({ title: "Erfolgreich hinzugefügt" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };

  const handleToggleEpisodeWatched = async (epKey: string) => {
    if (!user) { navigate("/auth"); return; }
    const newWatched = new Set(watchedEpisodes);
    if (newWatched.has(epKey)) newWatched.delete(epKey);
    else newWatched.add(epKey);
    setWatchedEpisodes(newWatched);
    localStorage.setItem(`watchedEpisodes_${animeId}`, JSON.stringify(Array.from(newWatched)));

    if (tracking) {
      try {
        await updateTracking.mutateAsync({
          animeId,
          updates: { current_episode: newWatched.size },
        });
      } catch {}
    }
  };

  const handleSaveNotes = async () => {
    if (!tracking) return;
    try {
      await updateTracking.mutateAsync({ animeId, updates: { notes } });
      toast({ title: "Notizen gespeichert" });
      setShowNotes(false);
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  };

  const currentStatus = tracking?.status;
  const progressWatched = watchedEpisodes.size;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 h-[500px]">
          <img src={series.cover_image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/60" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            {/* Poster */}
            <div className="shrink-0">
              <div className="relative mx-auto w-48 overflow-hidden rounded-xl shadow-2xl md:w-64">
                <img
                  src={selectedSeason?.cover_image || series.cover_image || "/placeholder.svg"}
                  alt={title}
                  className="w-full"
                />
                {tracking && totalEpisodes > 0 && (
                  <div className="absolute top-2 right-2 rounded-lg bg-black/70 px-2 py-1">
                    <span className="text-xs font-bold text-white">{progressWatched}/{totalEpisodes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
              {series.title_jp && <p className="mb-4 text-lg text-muted-foreground">{series.title_jp}</p>}

              {/* Detail sync in progress */}
              {detailSyncing && (!seasons || seasons.length === 0) && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Staffeln und Episoden werden geladen …
                </div>
              )}

              {/* Season Selector */}
              {seasons && seasons.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Staffeln</h3>
                  <div className="flex flex-wrap gap-2">
                    {seasons.map((s) => (
                      <Button
                        key={s.id}
                        variant={selectedSeasonId === s.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSeasonId(s.id)}
                        className="gap-1"
                      >
                        S{s.season_number}
                        {s.episode_count && <span className="text-xs opacity-70">({s.episode_count} Ep.)</span>}
                      </Button>
                    ))}
                  </div>
                  {selectedSeason?.title && (
                    <p className="mt-2 text-sm text-muted-foreground">{selectedSeason.title}</p>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
                {totalEpisodes > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Tv className="h-4 w-4" />
                    <span>{totalEpisodes} Episoden gesamt</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="mb-6 flex flex-wrap gap-2">
                {(series.genres || []).map((genre, i) => (
                  <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {genre}
                  </span>
                ))}
              </div>

              {/* Tracking */}
              <div className="mb-6 flex flex-wrap gap-3">
                <Button variant={currentStatus === "watching" ? "default" : "outline"} onClick={() => handleTrack("watching")} className="gap-2" disabled={addTracking.isPending}>
                  {currentStatus === "watching" ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />} Am schauen
                </Button>
                <Button variant={currentStatus === "completed" ? "default" : "outline"} onClick={() => handleTrack("completed")} className="gap-2" disabled={addTracking.isPending}>
                  <Check className="h-4 w-4" /> Abgeschlossen
                </Button>
                <Button variant={currentStatus === "plan_to_watch" ? "default" : "outline"} onClick={() => handleTrack("plan_to_watch")} className="gap-2" disabled={addTracking.isPending}>
                  {currentStatus === "plan_to_watch" ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Plane zu schauen
                </Button>
              </div>

              {/* Progress */}
              {tracking && totalEpisodes > 0 && (
                <div className="mb-6 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fortschritt:</span>
                    <span className="font-semibold">{progressWatched} / {totalEpisodes} Episoden</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min((progressWatched / totalEpisodes) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Beschreibung</h2>
                  {translatedSynopsis && (
                    <Button variant="ghost" size="sm" onClick={() => setShowOriginal(!showOriginal)} className="gap-2 text-xs">
                      <Languages className="h-3 w-3" /> {showOriginal ? "Übersetzung" : "Original"}
                    </Button>
                  )}
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {isTranslating ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Übersetze...</span>
                  ) : showOriginal ? (
                    series.description || "Keine Beschreibung verfügbar."
                  ) : (
                    translatedSynopsis || series.description || "Keine Beschreibung verfügbar."
                  )}
                </p>
              </div>

              <Button variant="outline" className="gap-2" asChild>
                <a href={`https://www.imdb.com/find?q=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> IMDb ansehen
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      {tracking && (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <Button variant="secondary" onClick={() => { setNotes(tracking.notes || ""); setShowNotes(!showNotes); }} className="mb-4 w-full justify-between gap-2 md:w-auto">
            <span>Notizen</span>
            {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {showNotes && (
            <div className="animate-fade-in rounded-xl border border-border bg-card p-4">
              <Textarea placeholder="Deine Notizen..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-4 min-h-[100px]" />
              <Button onClick={handleSaveNotes} className="gap-2"><Save className="h-4 w-4" /> Speichern</Button>
            </div>
          )}
        </section>
      )}

      {/* Episodes */}
      {selectedSeason && (
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Staffel {selectedSeason.season_number} — Episoden
            </h2>
          </div>
          {episodesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : episodes && episodes.length > 0 ? (
            <div className="space-y-2">
              {episodes.map((ep) => {
                const epKey = `s${selectedSeason.season_number}e${ep.episode_number}`;
                const isWatched = watchedEpisodes.has(epKey);
                return (
                  <div key={ep.id} className={cn(
                    "flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-all",
                    isWatched && "opacity-60"
                  )}>
                    {ep.thumbnail && (
                      <img src={ep.thumbnail} alt="" className="h-16 w-28 rounded-lg object-cover shrink-0" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        <span className="text-muted-foreground">E{ep.episode_number}</span>{" "}
                        {ep.title || `Episode ${ep.episode_number}`}
                      </p>
                      {ep.air_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(ep.air_date).toLocaleDateString("de-DE")}</p>
                      )}
                    </div>
                    {user && (
                      <Button
                        variant={isWatched ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleEpisodeWatched(epKey)}
                        className="shrink-0"
                      >
                        {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Keine Episoden-Daten verfügbar</p>
          )}
        </section>
      )}

      {/* Comments */}
      <AnimeCommentsSection animeId={animeId} />
    </div>
  );
};

export default AnimeDetailPage;

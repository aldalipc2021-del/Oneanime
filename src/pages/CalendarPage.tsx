import { useAllSeries, seriesToAnimeCard } from "@/hooks/useAnimeDB";
import { useTrackedAnime } from "@/hooks/useTracking";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/PromoBanner";
import { Loader2, Calendar as CalendarIcon, List, LayoutGrid, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const days = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

const CalendarPage = () => {
  const [showOnlyTracked, setShowOnlyTracked] = useState(false);
  const { user } = useAuth();
  const { data: allSeries, isLoading } = useAllSeries("airing");
  const { data: trackedAnime } = useTrackedAnime();

  const trackedIds = new Set(trackedAnime?.map((a) => a.anime_id) || []);
  const animeList = (allSeries || []).map(seriesToAnimeCard);
  const filtered = showOnlyTracked && user
    ? animeList.filter(a => trackedIds.has(a.id))
    : animeList;

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Laufende Anime</h1>
          <p className="text-muted-foreground">Alle aktuell laufenden Anime in deiner Bibliothek</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          {user && (
            <Button
              variant={showOnlyTracked ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyTracked(!showOnlyTracked)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Nur getrackte
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((anime) => (
              <Link
                key={anime.id}
                to={`/anime/${anime.id}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img src={anime.image} alt={anime.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>
                {trackedIds.has(anime.id) && (
                  <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">✓</span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-medium text-foreground line-clamp-2 text-sm">{anime.title}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">Keine laufenden Anime gefunden</p>
        )}

        <PromoBanner variant="leaderboard" className="mx-auto mt-8" />
      </div>
    </div>
  );
};

export default CalendarPage;

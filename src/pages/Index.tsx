import { useState, useEffect, useRef } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { useAllSeries, useSeriesCount, seriesToAnimeCard } from "@/hooks/useAnimeDB";
import { useTrackedAnime } from "@/hooks/useTracking";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp, Sparkles, Calendar, ChevronRight, Flame, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type FilterType = "all" | "airing" | "finished" | "upcoming";

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Alle", icon: <Library className="h-4 w-4" /> },
  { value: "airing", label: "Laufend", icon: <Flame className="h-4 w-4" /> },
  { value: "finished", label: "Abgeschlossen", icon: <Sparkles className="h-4 w-4" /> },
  { value: "upcoming", label: "Bald", icon: <Calendar className="h-4 w-4" /> },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const searchRef = useRef<HTMLDivElement>(null);

  const filterParam = activeFilter === "all" ? undefined : activeFilter;
  const { data: seriesData, isLoading } = useAllSeries(filterParam);
  const { data: totalCount } = useSeriesCount();
  const { user } = useAuth();
  const { data: trackedAnime } = useTrackedAnime();

  const completedAnimeIds = trackedAnime
    ?.filter(t => t.status === "completed")
    .map(t => t.anime_id) || [];

  const animeList = (seriesData || []).map(seriesToAnimeCard);
  const filteredList = user && completedAnimeIds.length > 0
    ? animeList.filter(a => !completedAnimeIds.includes(a.id))
    : animeList;

  const SkeletonCard = () => (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/30 bg-card animate-pulse">
      <div className="aspect-[2/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pb-6 pt-2 md:px-6 md:pb-10 md:pt-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[150px] animate-pulse" />
          <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-accent/6 blur-[130px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-3 animate-fade-up text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Entdecke deine{" "}
            <span className="text-gradient-primary">Lieblings-Anime</span>
          </h1>
          <p className="mb-6 animate-fade-up text-base text-muted-foreground md:text-lg" style={{ animationDelay: "100ms" }}>
            Tracke, was du schaust. Verpasse keine neue Episode mehr.
          </p>
        </div>

        <div ref={searchRef} className="mx-auto max-w-2xl animate-fade-up" style={{ animationDelay: "200ms" }}>
          <SearchBar size="lg" />
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-[72px] md:top-[88px] z-40 px-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-border/30 py-3">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full transition-all duration-300",
                  activeFilter === filter.value
                    ? "shadow-lg shadow-primary/20 scale-105"
                    : "hover:bg-secondary"
                )}
              >
                {filter.icon}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Anime Grid */}
      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {filterOptions.find((f) => f.value === activeFilter)?.label} Anime
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Top {filteredList.length} von {(totalCount ?? 0).toLocaleString("de-DE")} Anime
              </p>
            </div>
            <Link to="/search">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 group">
                Suche
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredList.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredList.map((anime, index) => (
                <AnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title}
                  image={anime.image}
                  score={anime.score}
                  episodes={anime.episodes}
                  status={anime.status}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30">
              <p className="text-muted-foreground">Keine Anime gefunden</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;

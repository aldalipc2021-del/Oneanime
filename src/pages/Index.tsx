import { useState, useEffect, useRef } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AnimeCard } from "@/components/AnimeCard";
import { PromoBanner } from "@/components/PromoBanner";
import { Button } from "@/components/ui/button";
import { useTopAnime, useSeasonalAnime, getDisplayTitle } from "@/hooks/useJikanApi";
import { useTrackedAnime } from "@/hooks/useTracking";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp, Sparkles, Calendar, Filter, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "airing" | "upcoming" | "bypopularity" | "favorite";

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "airing", label: "Aktuell", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "bypopularity", label: "Beliebt", icon: <Sparkles className="h-4 w-4" /> },
  { value: "upcoming", label: "Bald", icon: <Calendar className="h-4 w-4" /> },
  { value: "favorite", label: "Favoriten", icon: <Filter className="h-4 w-4" /> },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("airing");
  const [showStickySearch, setShowStickySearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { data: topAnimeData, isLoading: topLoading } = useTopAnime(activeFilter);
  const { data: seasonalData, isLoading: seasonalLoading } = useSeasonalAnime();
  const { user } = useAuth();
  const { data: trackedAnime } = useTrackedAnime();
  
  // Get IDs of completed anime
  const completedAnimeIds = trackedAnime
    ?.filter(t => t.status === "completed")
    .map(t => t.anime_id) || [];

  // Scroll detection for sticky search
  useEffect(() => {
    const handleScroll = () => {
      if (searchRef.current) {
        const rect = searchRef.current.getBoundingClientRect();
        setShowStickySearch(rect.bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter out completed anime
  const filterCompletedAnime = (animeList: any[] | undefined) => {
    if (!animeList || !user || completedAnimeIds.length === 0) return animeList;
    return animeList.filter((anime: any) => !completedAnimeIds.includes(anime.mal_id));
  };

  const filteredTopAnime = filterCompletedAnime(topAnimeData?.data);
  const filteredSeasonalAnime = filterCompletedAnime(seasonalData?.data);

  return (
    <div className="min-h-screen">
      {/* Initial Search Bar - visible at start */}
      <div ref={searchRef} className="px-4 py-4 md:px-6">
        <div className="mx-auto max-w-2xl">
          <SearchBar size="lg" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-8 md:px-6 md:py-12">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 animate-fade-up text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Entdecke deine{" "}
            <span className="text-gradient">Lieblings-Anime</span>
          </h1>
          <p className="animate-fade-up text-base text-muted-foreground md:text-lg" style={{ animationDelay: "100ms" }}>
            Tracke, was du schaust. Verpasse keine neue Episode mehr.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap",
                  activeFilter === filter.value && "shadow-lg shadow-primary/25"
                )}
              >
                {filter.icon}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Top Anime Grid */}
      <section className="px-4 pb-12 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {filterOptions.find((f) => f.value === activeFilter)?.label} Anime
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Alle anzeigen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {topLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredTopAnime?.slice(0, 12).map((anime: any, index: number) => (
                <AnimeCard
                  key={anime.mal_id}
                  id={anime.mal_id}
                  title={getDisplayTitle(anime)}
                  image={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
                  score={anime.score}
                  episodes={anime.episodes}
                  status={anime.status}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Promo Banner */}
        <PromoBanner variant="leaderboard" className="mx-auto" />
      </section>

      {/* Seasonal Anime Section */}
      <section className="bg-card/50 px-4 py-12 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Diese Saison</h2>
              <p className="text-sm text-muted-foreground">Die beliebtesten Anime der aktuellen Saison</p>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Alle anzeigen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {seasonalLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredSeasonalAnime?.slice(0, 12).map((anime: any, index: number) => (
                <AnimeCard
                  key={anime.mal_id}
                  id={anime.mal_id}
                  title={getDisplayTitle(anime)}
                  image={anime.images.webp.large_image_url || anime.images.jpg.large_image_url}
                  score={anime.score}
                  episodes={anime.episodes}
                  status={anime.status}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;

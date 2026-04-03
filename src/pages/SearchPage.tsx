import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { useSearchSeries, useDBGenres, seriesToAnimeCard } from "@/hooks/useAnimeDB";
import { Loader2, Filter, X } from "lucide-react";

const statusOptions = [
  { value: "", label: "Alle Status" },
  { value: "airing", label: "Laufend" },
  { value: "complete", label: "Abgeschlossen" },
  { value: "upcoming", label: "Bald" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: genresData } = useDBGenres();
  const { data: searchData, isLoading } = useSearchSeries(
    query || undefined,
    selectedGenre || undefined,
    status || undefined,
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const clearFilters = () => {
    setStatus("");
    setSelectedGenre("");
  };

  const hasActiveFilters = !!status || !!selectedGenre;
  const results = (searchData || []).map(seriesToAnimeCard);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">Anime Suchen</h1>
          <SearchBar autoFocus className="max-w-2xl" />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-4 w-4" />
              Filter löschen
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={status === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatus(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {genresData?.map((genre: any) => (
                    <Button
                      key={genre.name}
                      variant={selectedGenre === genre.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedGenre(selectedGenre === genre.name ? "" : genre.name)}
                    >
                      {genre.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{results.length} Ergebnisse</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.map((anime, index) => (
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
          </>
        ) : query || hasActiveFilters ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="mb-2 text-lg font-medium text-foreground">Keine Ergebnisse gefunden</p>
            <p className="text-sm text-muted-foreground">Versuche andere Suchbegriffe oder Filter</p>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="mb-2 text-lg font-medium text-foreground">Suche nach Anime</p>
            <p className="text-sm text-muted-foreground">Gib einen Suchbegriff ein oder nutze die Filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

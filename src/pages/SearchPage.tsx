import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { useSearchAnime, useGenres, getDisplayTitle } from "@/hooks/useJikanApi";
import { Loader2, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "Alle Status" },
  { value: "airing", label: "Laufend" },
  { value: "complete", label: "Abgeschlossen" },
  { value: "upcoming", label: "Bald" },
];

const typeOptions = [
  { value: "", label: "Alle Typen" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Film" },
  { value: "ova", label: "OVA" },
  { value: "special", label: "Special" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: genresData } = useGenres();
  const { data: searchData, isLoading } = useSearchAnime({
    q: query,
    status: status || undefined,
    type: type || undefined,
    genres: selectedGenres.length > 0 ? selectedGenres.join(",") : undefined,
    limit: 24,
    order_by: "score",
    sort: "desc",
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setStatus("");
    setType("");
    setSelectedGenres([]);
  };

  const hasActiveFilters = status || type || selectedGenres.length > 0;

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">Anime Suchen</h1>
          <SearchBar autoFocus className="max-w-2xl" />
        </div>

        {/* Filters Toggle */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs text-primary">
                {(status ? 1 : 0) + (type ? 1 : 0) + selectedGenres.length}
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Filter löschen
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 animate-fade-in rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Status Filter */}
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

              {/* Type Filter */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Typ</h3>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={type === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setType(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Genres Filter */}
              <div className="md:col-span-3">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {genresData?.slice(0, 20).map((genre: any) => (
                    <Button
                      key={genre.mal_id}
                      variant={selectedGenres.includes(genre.mal_id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleGenre(genre.mal_id)}
                    >
                      {genre.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchData?.data?.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchData.pagination?.items?.total || searchData.data.length} Ergebnisse gefunden
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {searchData.data.map((anime: any, index: number) => (
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
          </>
        ) : query || hasActiveFilters ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="mb-2 text-lg font-medium text-foreground">Keine Ergebnisse gefunden</p>
            <p className="text-sm text-muted-foreground">
              Versuche andere Suchbegriffe oder Filter
            </p>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="mb-2 text-lg font-medium text-foreground">Suche nach Anime</p>
            <p className="text-sm text-muted-foreground">
              Gib einen Suchbegriff ein oder nutze die Filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

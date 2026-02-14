import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResult {
  mal_id: number;
  title: string;
  image: string;
  type: string;
  episodes: number | null;
}

interface SearchBarProps {
  className?: string;
  size?: "default" | "lg";
  autoFocus?: boolean;
}

const ANILIST_URL = "https://graphql.anilist.co";

export const SearchBar = ({ className, size = "default", autoFocus = false }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAnime = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const gqlQuery = `
          query ($search: String) {
            Page(page: 1, perPage: 8) {
              media(type: ANIME, search: $search, isAdult: false) {
                id
                idMal
                title { romaji english }
                coverImage { medium }
                format
                episodes
              }
            }
          }
        `;

        const response = await fetch(ANILIST_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: gqlQuery, variables: { search: query } }),
        });

        const data = await response.json();
        const media = data.data?.Page?.media || [];

        setResults(
          media.map((m: any) => ({
            mal_id: m.idMal || m.id,
            title: m.title.english || m.title.romaji,
            image: m.coverImage.medium,
            type: m.format || "Unknown",
            episodes: m.episodes,
          }))
        );
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchAnime, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (id: number) => {
    navigate(`/anime/${id}`);
    setQuery("");
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
            size === "lg" ? "h-5 w-5" : "h-4 w-4"
          )} />
          <Input
            type="text"
            placeholder="Anime suchen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            autoFocus={autoFocus}
            className={cn(
              "pl-11 pr-20",
              size === "lg" && "h-14 text-lg rounded-xl"
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" size="sm" className="h-7">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suchen"}
            </Button>
          </div>
        </div>
      </form>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((anime) => (
              <button
                key={anime.mal_id}
                onClick={() => handleSelect(anime.mal_id)}
                className="flex w-full items-center gap-3 p-3 transition-colors hover:bg-secondary/50"
              >
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="h-16 w-12 rounded-lg object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="line-clamp-1 font-medium text-foreground">{anime.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {anime.type} {anime.episodes && `• ${anime.episodes} Ep.`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

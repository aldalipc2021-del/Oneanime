import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimeCard } from "@/components/AnimeCard";

interface RailItem {
  id: number;
  title: string;
  image: string;
  status?: string;
  episodes?: number;
  score?: number;
}

interface AnimeRailProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  items: RailItem[];
  isLoading?: boolean;
  moreHref?: string;
}

export const AnimeRail = ({ title, subtitle, icon, items, isLoading, moreHref }: AnimeRailProps) => {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * (scroller.current.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              {icon}
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {moreHref && (
              <Link to={moreHref}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Alle
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 rounded-full md:inline-flex"
              onClick={() => scrollBy(-1)}
              aria-label="Zurück"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 rounded-full md:inline-flex"
              onClick={() => scrollBy(1)}
              aria-label="Weiter"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scroller}
          className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[140px] shrink-0 animate-pulse overflow-hidden rounded-xl border border-border/30 bg-card sm:w-[170px]"
                >
                  <div className="aspect-[2/3] bg-muted" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))
            : items.map((item, index) => (
                <AnimeCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  image={item.image}
                  status={item.status}
                  episodes={item.episodes}
                  score={item.score}
                  index={index}
                  className="w-[140px] shrink-0 snap-start sm:w-[170px]"
                />
              ))}
        </div>
      </div>
    </section>
  );
};

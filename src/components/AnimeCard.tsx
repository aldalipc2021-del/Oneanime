import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Star, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  id: number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  status?: string;
  className?: string;
  index?: number;
}

export const AnimeCard = forwardRef<HTMLAnchorElement, AnimeCardProps>(
  ({ id, title, image, score, episodes, status, className, index = 0 }, ref) => {
    const statusLabels: Record<string, string> = {
      "Currently Airing": "Laufend",
      "Finished Airing": "Abgeschlossen",
      "Not yet aired": "Bald",
    };

    return (
      <Link
        ref={ref}
        to={`/anime/${id}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-500",
          "hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/30",
          "animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-70" />

          {/* Status Badge */}
          {status && (
            <div className="absolute top-2.5 left-2.5">
              <span
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm",
                  status === "Currently Airing"
                    ? "bg-accent/90 text-accent-foreground"
                    : status === "Finished Airing"
                    ? "bg-green-500/90 text-primary-foreground"
                    : "bg-primary/90 text-primary-foreground"
                )}
              >
                {statusLabels[status] || status}
              </span>
            </div>
          )}

          {/* Score Badge */}
          {score && score > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-card/95 px-2 py-1 backdrop-blur-md shadow-sm">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs font-bold text-foreground">{score.toFixed(1)}</span>
            </div>
          )}

          {/* Play Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/95 shadow-xl shadow-primary/40 backdrop-blur-sm transition-transform duration-500 scale-75 group-hover:scale-100">
              <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
            {title}
          </h3>

          {episodes && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{episodes} Episoden</span>
            </div>
          )}
        </div>
      </Link>
    );
  }
);

AnimeCard.displayName = "AnimeCard";

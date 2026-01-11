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

export const AnimeCard = ({
  id,
  title,
  image,
  score,
  episodes,
  status,
  className,
  index = 0,
}: AnimeCardProps) => {
  const statusLabels: Record<string, string> = {
    "Currently Airing": "Laufend",
    "Finished Airing": "Abgeschlossen",
    "Not yet aired": "Bald",
  };

  return (
    <Link
      to={`/anime/${id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10",
        "animate-fade-up",
        className
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />
        
        {/* Status Badge */}
        {status && (
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold backdrop-blur-sm",
                status === "Currently Airing"
                  ? "bg-accent/80 text-accent-foreground"
                  : status === "Finished Airing"
                  ? "bg-green-500/80 text-white"
                  : "bg-primary/80 text-primary-foreground"
              )}
            >
              {statusLabels[status] || status}
            </span>
          </div>
        )}

        {/* Score Badge */}
        {score && score > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-semibold text-foreground">{score.toFixed(1)}</span>
          </div>
        )}

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 shadow-lg shadow-primary/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        
        {episodes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{episodes} Episoden</span>
          </div>
        )}
      </div>
    </Link>
  );
};

import { useSchedule, getDisplayTitle } from "@/hooks/useAniListApi";
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
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showOnlyTracked, setShowOnlyTracked] = useState(false);
  
  const { user } = useAuth();
  const { data: scheduleData, isLoading } = useSchedule(selectedDay);
  const { data: trackedAnime } = useTrackedAnime();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // Get tracked anime IDs for filtering
  const trackedIds = new Set(trackedAnime?.map((a) => a.anime_id) || []);

  // Filter schedule if showing only tracked
  const filterSchedule = (animeList: any[]) => {
    if (!showOnlyTracked || !user) return animeList;
    return animeList.filter((anime) => trackedIds.has(anime.mal_id));
  };

  // Group anime by day if no specific day selected
  const groupedByDay = !selectedDay && scheduleData 
    ? days.reduce((acc, day) => {
        const dayAnime = scheduleData.filter(
          (anime: any) => anime.broadcast?.day === day.value
        );
        acc[day.value] = filterSchedule(dayAnime);
        return acc;
      }, {} as Record<string, any[]>)
    : null;

  const filteredScheduleData = selectedDay ? filterSchedule(scheduleData || []) : null;

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Airing-Kalender</h1>
          <p className="text-muted-foreground">
            {showOnlyTracked 
              ? "Zeigt nur Anime, die du trackst" 
              : "Alle aktuell laufenden Anime"}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Day Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedDay ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(undefined)}
            >
              Alle
            </Button>
            {days.map((day) => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day.value)}
                className={cn(
                  day.value === today && !selectedDay && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {day.label}
              </Button>
            ))}
          </div>

          {/* Filter & View Toggle */}
          <div className="ml-auto flex items-center gap-2">
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
            
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Not logged in notice */}
        {!user && showOnlyTracked && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-muted-foreground">
              Melde dich an, um deinen persönlichen Kalender zu sehen.
            </p>
            <Link to="/auth">
              <Button variant="gradient" size="sm" className="mt-2">
                Anmelden
              </Button>
            </Link>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : selectedDay ? (
          // Single Day View
          <div className="space-y-4">
            <h2 className="text-xl font-semibold capitalize">
              {days.find(d => d.value === selectedDay)?.label}
            </h2>
            {filteredScheduleData && filteredScheduleData.length > 0 ? (
              viewMode === "list" ? (
                <div className="space-y-2">
                  {filteredScheduleData.map((anime: any) => (
                    <ScheduleListItem 
                      key={anime.mal_id} 
                      anime={anime} 
                      isTracked={trackedIds.has(anime.mal_id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredScheduleData.map((anime: any) => (
                    <ScheduleGridItem 
                      key={anime.mal_id} 
                      anime={anime}
                      isTracked={trackedIds.has(anime.mal_id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <p className="text-muted-foreground">
                {showOnlyTracked 
                  ? "Keine getrackten Anime an diesem Tag" 
                  : "Keine Anime an diesem Tag"}
              </p>
            )}
          </div>
        ) : (
          // All Days View
          <div className="space-y-8">
            {days.map((day) => {
              const animeForDay = groupedByDay?.[day.value] || [];
              if (animeForDay.length === 0) return null;
              
              return (
                <div key={day.value}>
                  <h2 className={cn(
                    "mb-4 text-xl font-semibold",
                    day.value === today && "text-primary"
                  )}>
                    {day.label}
                    {day.value === today && (
                      <span className="ml-2 text-sm font-normal text-primary">(Heute)</span>
                    )}
                  </h2>
                  {viewMode === "list" ? (
                    <div className="space-y-2">
                      {animeForDay.slice(0, 10).map((anime: any) => (
                        <ScheduleListItem 
                          key={anime.mal_id} 
                          anime={anime}
                          isTracked={trackedIds.has(anime.mal_id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {animeForDay.slice(0, 10).map((anime: any) => (
                        <ScheduleGridItem 
                          key={anime.mal_id} 
                          anime={anime}
                          isTracked={trackedIds.has(anime.mal_id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Promo Banner */}
        <PromoBanner variant="leaderboard" className="mx-auto mt-8" />
      </div>
    </div>
  );
};

const ScheduleListItem = ({ anime, isTracked }: { anime: any; isTracked?: boolean }) => {
  const title = getDisplayTitle(anime);
  const time = anime.broadcast?.time || "TBA";
  
  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80",
        isTracked ? "border-primary/30" : "border-border"
      )}
    >
      <img
        src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url}
        alt={title}
        className="h-16 w-12 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground line-clamp-1">{title}</p>
          {isTracked && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Getrackt
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {anime.episodes ? `${anime.episodes} Episoden` : "Laufend"} • {anime.type}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-primary">{time} JST</span>
      </div>
    </Link>
  );
};

const ScheduleGridItem = ({ anime, isTracked }: { anime: any; isTracked?: boolean }) => {
  const title = getDisplayTitle(anime);
  const time = anime.broadcast?.time || "TBA";
  
  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/50",
        isTracked ? "border-primary/30" : "border-border"
      )}
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>
      {isTracked && (
        <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          ✓
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-medium text-foreground line-clamp-2 text-sm">{title}</p>
        <p className="text-xs text-primary">{time} JST</p>
      </div>
    </Link>
  );
};

export default CalendarPage;

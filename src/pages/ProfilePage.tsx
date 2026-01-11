import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, Bell, Globe, ChevronRight, Loader2, Play, Check, Star, Moon, Sun, HelpCircle, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTrackedAnime, TrackingStatus } from "@/hooks/useTracking";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { CustomListsSection } from "@/components/CustomListsSection";
import { PromoBanner } from "@/components";
import { HelpDialog } from "@/components/HelpDialog";
import { MALImportDialog } from "@/components/MALImportDialog";
import { useTheme } from "next-themes";

const statusLabels: Record<TrackingStatus, { label: string; icon: React.ReactNode }> = {
  watching: { label: "Am schauen", icon: <Play className="h-4 w-4" /> },
  completed: { label: "Abgeschlossen", icon: <Check className="h-4 w-4" /> },
  plan_to_watch: { label: "Geplant", icon: <Star className="h-4 w-4" /> },
};

const ProfilePage = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  const { data: trackedAnime, isLoading: trackingLoading } = useTrackedAnime();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TrackingStatus | "all">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMALImport, setShowMALImport] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Abgemeldet",
      description: "Bis bald!",
    });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Nicht angemeldet</h1>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Melde dich an, um deine Anime zu tracken und Benachrichtigungen zu erhalten.
        </p>
        <Link to="/auth">
          <Button variant="gradient" size="lg">
            Jetzt anmelden
          </Button>
        </Link>
        
        {/* Neuer Button für Einstellungen ohne Login */}
        <Button variant="ghost" className="mt-4 gap-2" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4" />
          Einstellungen
        </Button>
        
        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      </div>
    );
  }

  const filteredAnime = trackedAnime?.filter((anime) =>
    activeTab === "all" ? true : anime.status === activeTab
  );

  const stats = {
    watching: trackedAnime?.filter((a) => a.status === "watching").length || 0,
    completed: trackedAnime?.filter((a) => a.status === "completed").length || 0,
    plan_to_watch: trackedAnime?.filter((a) => a.status === "plan_to_watch").length || 0,
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.display_name || "Anime-Fan"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.watching}</p>
            <p className="text-sm text-muted-foreground">Am schauen</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Abgeschlossen</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-3xl font-bold text-accent">{stats.plan_to_watch}</p>
            <p className="text-sm text-muted-foreground">Geplant</p>
          </div>
        </div>

        {/* Tracked Anime Tabs */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Meine Anime-Liste</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
            >
              Alle ({trackedAnime?.length || 0})
            </Button>
            {(Object.keys(statusLabels) as TrackingStatus[]).map((status) => (
              <Button
                key={status}
                variant={activeTab === status ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(status)}
                className="gap-2"
              >
                {statusLabels[status].icon}
                {statusLabels[status].label} ({stats[status]})
              </Button>
            ))}
          </div>
        </div>

        {/* Tracked Anime List */}
        {trackingLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredAnime && filteredAnime.length > 0 ? (
          <div className="mb-8 space-y-2">
            {filteredAnime.map((anime) => (
              <Link
                key={anime.id}
                to={`/anime/${anime.anime_id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80"
              >
                {anime.anime_image && (
                  <img
                    src={anime.anime_image}
                    alt={anime.anime_title}
                    className="h-16 w-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground line-clamp-1">{anime.anime_title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {anime.current_episode}/{anime.total_episodes || "?"}
                    </p>
                    {anime.total_episodes && anime.total_episodes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((anime.current_episode / anime.total_episodes) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    anime.status === "watching" && "bg-primary/10 text-primary",
                    anime.status === "completed" && "bg-green-500/10 text-green-500",
                    anime.status === "plan_to_watch" && "bg-accent/10 text-accent"
                  )}
                >
                  {statusLabels[anime.status].label}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab === "all"
                ? "Du trackst noch keine Anime. Suche nach deinen Lieblings-Anime und füge sie hinzu!"
                : `Keine Anime mit Status "${statusLabels[activeTab as TrackingStatus].label}"`}
            </p>
            <Link to="/search">
              <Button variant="gradient" size="sm" className="mt-4">
                Anime suchen
              </Button>
            </Link>
          </div>
        )}

        {/* Promo Banner */}
        <PromoBanner variant="horizontal" className="mb-8 w-full" />

        {/* Custom Lists */}
        <div className="mb-8">
          <CustomListsSection />
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Einstellungen</h2>

          <div className="space-y-2">
            <SettingsItem
              icon={theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              title="Erscheinungsbild"
              description={theme === "dark" ? "Dunkler Modus" : "Heller Modus"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
            <SettingsItem
              icon={<Download className="h-5 w-5" />}
              title="Von MyAnimeList importieren"
              description="Importiere deine Anime-Liste von MAL"
              onClick={() => setShowMALImport(true)}
            />
            <SettingsItem
              icon={<Bell className="h-5 w-5" />}
              title="Benachrichtigungen"
              description="Push-Benachrichtigungen für neue Episoden"
              onClick={() => setShowSettings(true)}
            />
            <SettingsItem
              icon={<Globe className="h-5 w-5" />}
              title="Sprache & Region"
              description={`${profile?.preferred_language?.toUpperCase() || "DE"} • ${profile?.country || "DE"}`}
              onClick={() => setShowSettings(true)}
            />
            <SettingsItem
              icon={<Settings className="h-5 w-5" />}
              title="Alle Einstellungen"
              description="Sprache, Land, Benachrichtigungen"
              onClick={() => setShowSettings(true)}
            />
            <SettingsItem
              icon={<HelpCircle className="h-5 w-5" />}
              title="Hilfe & Support"
              description="FAQs, Dokumentation und Kontakt"
              onClick={() => setShowHelp(true)}
            />
          </div>

          <hr className="border-border" />

          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </Button>
        </div>
      </div>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
      <MALImportDialog open={showMALImport} onOpenChange={setShowMALImport} />
    </div>
  );
};

const SettingsItem = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}) => (
  <button 
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground" />
  </button>
);

export default ProfilePage;

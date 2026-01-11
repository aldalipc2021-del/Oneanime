import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Moon, Sun, Globe, Bell, Loader2, Send, Film, Languages } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const languages = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
];

const countries = [
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
  { value: "US", label: "USA" },
  { value: "JP", label: "Japan" },
  { value: "GB", label: "UK" },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, user } = useAuth();
  const { toast } = useToast();
  const { isEnabled: notificationsEnabled, isLoading: notificationsLoading, toggleNotifications, sendTestNotification } = usePushNotifications();
  
  // Initialisiere State mit Profil ODER LocalStorage
  const [language, setLanguage] = useState(profile?.preferred_language || localStorage.getItem("settings_language") || "de");
  const [country, setCountry] = useState(profile?.country || localStorage.getItem("settings_country") || "DE");
  const [translateDescriptions, setTranslateDescriptions] = useState(
    profile?.translate_descriptions ?? (localStorage.getItem("settings_translate") !== "false")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [includeFilmsAsSeason, setIncludeFilmsAsSeason] = useState(() => {
    return localStorage.getItem("includeFilmsAsSeason") === "true";
  });

  const handleFilmSettingChange = (checked: boolean) => {
    setIncludeFilmsAsSeason(checked);
    localStorage.setItem("includeFilmsAsSeason", String(checked));
  };

  useEffect(() => {
    if (profile) {
      setLanguage(profile.preferred_language || "de");
      setCountry(profile.country || "DE");
      setTranslateDescriptions(profile.translate_descriptions ?? true);
    } else {
      // Lade aus LocalStorage wenn nicht eingeloggt
      setLanguage(localStorage.getItem("settings_language") || "de");
      setCountry(localStorage.getItem("settings_country") || "DE");
      setTranslateDescriptions(localStorage.getItem("settings_translate") !== "false");
    }
  }, [profile, open]);

  const handleSave = async () => {
    setIsSaving(true);
    
    if (user) {
      // Wenn eingeloggt: Speichere in Datenbank
      const { error } = await updateProfile({
        preferred_language: language,
        country: country,
        translate_descriptions: translateDescriptions,
      });
      
      if (error) {
        toast({
          title: "Fehler",
          description: "Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Gespeichert",
          description: "Deine Einstellungen wurden aktualisiert.",
        });
        onOpenChange(false);
      }
    } else {
      // Wenn NICHT eingeloggt: Speichere lokal
      localStorage.setItem("settings_language", language);
      localStorage.setItem("settings_country", country);
      localStorage.setItem("settings_translate", String(translateDescriptions));
      
      // Event feuern, damit andere Komponenten (wie useTranslation) das mitbekommen
      window.dispatchEvent(new Event("local-settings-changed"));

      toast({
        title: "Gespeichert",
        description: "Deine Einstellungen wurden lokal gespeichert.",
      });
      onOpenChange(false);
    }
    
    setIsSaving(false);
  };

  const handleNotificationToggle = async () => {
    await toggleNotifications();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>Passe deine Einstellungen an</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base">Erscheinungsbild</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dunkler Modus" : "Heller Modus"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base">Sprache</Label>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Sprache wählen" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label className="text-base">Land/Region</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Land wählen" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notifications Toggle - Nur anzeigen wenn eingeloggt */}
          {user && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base">Push-Benachrichtigungen</Label>
                    <p className="text-sm text-muted-foreground">
                      Für neue Episoden
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={notificationsLoading}
                />
              </div>
              {notificationsEnabled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={sendTestNotification}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Test-Benachrichtigung senden
                </Button>
              )}
            </div>
          )}

          {/* Translation Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Beschreibungen übersetzen</Label>
                <p className="text-sm text-muted-foreground">
                  Anime-Beschreibungen automatisch übersetzen
                </p>
              </div>
            </div>
            <Switch
              checked={translateDescriptions}
              onCheckedChange={setTranslateDescriptions}
            />
          </div>

          {/* Films Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Filme als Staffel</Label>
                <p className="text-sm text-muted-foreground">
                  Filme im gleichen Eintrag anzeigen
                </p>
              </div>
            </div>
            <Switch
              checked={includeFilmsAsSeason}
              onCheckedChange={handleFilmSettingChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

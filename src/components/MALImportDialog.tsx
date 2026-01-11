import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMALImport } from "@/hooks/useMALImport";
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

interface MALImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MALImportDialog = ({ open, onOpenChange }: MALImportDialogProps) => {
  const [username, setUsername] = useState("");
  const importMutation = useMALImport();

  const handleImport = async () => {
    if (!username.trim()) {
      return;
    }

    await importMutation.mutateAsync({ username });

    // Close dialog after successful import
    if (!importMutation.isPending) {
      setUsername("");
      onOpenChange(false);
    }
  };

  const isLoading = importMutation.isPending;
  const isSuccess = importMutation.isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>MyAnimeList importieren</DialogTitle>
          <DialogDescription>
            Importiere deine Anime-Liste direkt von MyAnimeList zu OneAnime
          </DialogDescription>
        </DialogHeader>

        {isSuccess && importMutation.data ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Import erfolgreich abgeschlossen!
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <p className="font-medium">
                ✓ {importMutation.data.imported} Anime importiert
              </p>
              {importMutation.data.failed > 0 && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="font-medium text-yellow-900">
                    ⚠ {importMutation.data.failed} Anime konnten nicht importiert werden
                  </p>
                  {importMutation.data.errors.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-yellow-700">
                      {importMutation.data.errors.slice(0, 3).map((error, idx) => (
                        <li key={idx}>
                          • {error.title}: {error.reason}
                        </li>
                      ))}
                      {importMutation.data.errors.length > 3 && (
                        <li>• und {importMutation.data.errors.length - 3} weitere...</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setUsername("");
                onOpenChange(false);
                importMutation.reset();
              }}
              className="w-full"
              variant="default"
            >
              Schließen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Gib deinen MyAnimeList-Benutzernamen ein, um deine Anime-Liste zu importieren.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="mal-username">MyAnimeList Benutzername</Label>
              <Input
                id="mal-username"
                placeholder="z.B. dein_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleImport();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Finde deinen Benutzernamen auf{" "}
                <a
                  href="https://myanimelist.net/profile.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  MyAnimeList.net <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {importMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importMutation.error?.message || "Ein Fehler ist aufgetreten"}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1 gap-2"
                disabled={!username.trim() || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Importieren..." : "Importieren"}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Die API-Verbindung erfolgt über die offizielle MyAnimeList API v2. 
                Deine Daten werden direkt zu OneAnime synchronisiert und nicht an Dritte weitergeleitet.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

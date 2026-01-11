import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCustomLists,
  useCreateCustomList,
  useDeleteCustomList,
  useUpdateCustomList,
  useUserListCount,
} from "@/hooks/useCustomLists";
import { useIsPremium } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Loader2,
  List,
  Globe,
  Lock,
  Trash2,
  Edit2,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FREE_LISTS = 1;

export const CustomListsSection = () => {
  const { data: lists, isLoading } = useCustomLists();
  const { data: listCount = 0 } = useUserListCount();
  const { isPremium } = useIsPremium();
  const createList = useCreateCustomList();
  const deleteList = useDeleteCustomList();
  const updateList = useUpdateCustomList();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [editingList, setEditingList] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: false,
  });

  const canCreateList = isPremium || listCount < MAX_FREE_LISTS;

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte gib einen Namen für die Liste ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createList.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_public: formData.is_public,
      });

      toast({
        title: "Liste erstellt",
        description: `"${formData.name}" wurde erfolgreich erstellt.`,
      });

      setFormData({ name: "", description: "", is_public: false });
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Liste konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (listId: string, listName: string) => {
    try {
      await deleteList.mutateAsync(listId);
      toast({
        title: "Liste gelöscht",
        description: `"${listName}" wurde gelöscht.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Liste konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (listId: string) => {
    try {
      await updateList.mutateAsync({
        listId,
        updates: {
          name: formData.name,
          description: formData.description || null,
          is_public: formData.is_public,
        },
      });

      toast({
        title: "Liste aktualisiert",
      });

      setEditingList(null);
      setFormData({ name: "", description: "", is_public: false });
    } catch (error) {
      toast({
        title: "Fehler",
        variant: "destructive",
      });
    }
  };

  const startEdit = (list: any) => {
    setEditingList(list.id);
    setFormData({
      name: list.name,
      description: list.description || "",
      is_public: list.is_public,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meine Listen</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!canCreateList) {
                  setShowPremiumDialog(true);
                  return;
                }
              }}
              disabled={!canCreateList && !isPremium}
            >
              <Plus className="mr-2 h-4 w-4" />
              Neue Liste
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Liste erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="z.B. Meine Favoriten"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Worum geht es in dieser Liste?"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {formData.is_public ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="public">
                    {formData.is_public ? "Öffentlich" : "Privat"}
                  </Label>
                </div>
                <Switch
                  id="public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_public: checked })
                  }
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createList.isPending}
                className="w-full"
              >
                {createList.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Liste erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Premium Banner */}
      {!isPremium && listCount >= MAX_FREE_LISTS && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Mehr Listen erstellen?</p>
              <p className="text-sm text-muted-foreground">
                Mit Premium kannst du unbegrenzt Listen erstellen.
              </p>
              <Link to="/premium">
                <Button variant="gradient" size="sm" className="mt-3">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Premium holen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      {lists && lists.length > 0 ? (
        <div className="space-y-2">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              {editingList === list.id ? (
                <div className="flex-1 space-y-3">
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_public: checked })
                        }
                      />
                      <Label className="text-sm">
                        {formData.is_public ? "Öffentlich" : "Privat"}
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(list.id)}
                        disabled={updateList.isPending}
                      >
                        Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingList(null)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to={`/lists/${list.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <List className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{list.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {list.is_public ? (
                          <>
                            <Globe className="h-3 w-3" />
                            <span>Öffentlich</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            <span>Privat</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(list)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(list.id, list.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <List className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            Du hast noch keine eigenen Listen erstellt.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => canCreateList && setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Erste Liste erstellen
          </Button>
        </div>
      )}
    </div>
  );
};

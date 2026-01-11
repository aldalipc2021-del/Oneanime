import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCustomLists, useCustomListItems } from "@/hooks/useCustomLists";
import { ArrowLeft, Globe, Lock, Loader2 } from "lucide-react";

const CustomListPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: lists } = useCustomLists();
  const { data: items, isLoading } = useCustomListItems(id || "");

  const list = lists?.find((l) => l.id === id);

  if (!list) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">Liste nicht gefunden</p>
        <Link to="/profile">
          <Button variant="outline" className="mt-4">
            Zurück zum Profil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Profil
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{list.name}</h1>
              {list.description && (
                <p className="mt-1 text-muted-foreground">{list.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {list.is_public ? (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Öffentlich</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Privat</span>
                  </>
                )}
                <span>•</span>
                <span>{items?.length || 0} Anime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/anime/${item.anime_id}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  {item.anime_image ? (
                    <img
                      src={item.anime_image}
                      alt={item.anime_title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <span className="text-muted-foreground">Kein Bild</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium line-clamp-2">{item.anime_title}</p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">
              Diese Liste ist noch leer. Füge Anime von deren Detail-Seiten hinzu!
            </p>
            <Link to="/search">
              <Button variant="outline" className="mt-4">
                Anime suchen
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomListPage;

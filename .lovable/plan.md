
# Migration von Jikan API zu AniList API

## Warum AniList?
- **Zuverlassiger**: 90 Anfragen/Minute (vs. Jikans 3/Sekunde), kaum Rate-Limiting-Probleme
- **Bessere Staffel-Gruppierung**: Anime-Relationen (Sequel/Prequel) sind direkt in der API enthalten
- **Sehr bekannt**: Eine der meistgenutzten Anime-APIs weltweit
- **Kein API-Key nötig**: Komplett kostenlos und offen
- **GraphQL**: Nur die Daten abrufen, die wirklich gebraucht werden

## Was sich andert

### Betroffene Dateien

| Datei | Anderung |
|---|---|
| `src/hooks/useJikanApi.ts` | Komplett umschreiben auf AniList GraphQL |
| `src/hooks/useAnimeSeasons.ts` | Vereinfachen - AniList liefert Relationen direkt mit |
| `src/components/SearchBar.tsx` | API-Aufruf auf AniList umstellen |
| `src/pages/Index.tsx` | Daten-Mapping anpassen (neue Feldnamen) |
| `src/pages/SearchPage.tsx` | Daten-Mapping anpassen |
| `src/pages/CalendarPage.tsx` | Schedule-Daten von AniList nutzen |
| `src/pages/AnimeDetailPage.tsx` | Daten-Mapping anpassen |
| `src/components/EpisodeList.tsx` | Episode-Interface anpassen |
| `src/components/SeasonSelector.tsx` | SeasonEntry-Typ anpassen |
| `vite.config.ts` | Cache-URL auf AniList andern |
| `src/pages/LegalPage.tsx` | AniList statt Jikan erwahnen |

### Wichtig: Tracking-Kompatibilitat
- Die aktuelle Datenbank speichert `anime_id` als MAL-IDs
- AniList hat ein `idMal`-Feld, das die MAL-ID enthalt
- Wir speichern **beide IDs** und nutzen AniList-IDs als Primar-ID fur die API, behalten aber die MAL-ID fur bestehende Tracking-Daten
- Bestehende getrackte Anime werden weiterhin korrekt angezeigt

## Technische Details

### 1. Neuer API-Hook (`useJikanApi.ts` wird zu `useAniListApi.ts`)
- GraphQL-Queries an `https://graphql.anilist.co`
- Alle Hooks werden neu implementiert: `useTopAnime`, `useSeasonalAnime`, `useAnimeById`, `useSearchAnime`, `useSchedule`, `useGenres`, `useAnimeRecommendations`
- Einheitliches `Anime`-Interface das intern die AniList-Daten auf das bestehende Format mappt

### 2. Vereinfachtes Staffel-System (`useAnimeSeasons.ts`)
- AniList liefert Relationen (SEQUEL, PREQUEL, SIDE_STORY) direkt im Anime-Query mit
- Kein separater BFS-Algorithmus mit dutzenden API-Calls mehr notig
- Eine einzige Query reicht um alle Staffeln zu bekommen

### 3. Daten-Mapping
- AniList nutzt andere Feldnamen (z.B. `coverImage` statt `images`, `title.english` statt `title_english`)
- Ein zentrales Mapping sorgt dafur, dass alle bestehenden Komponenten weiterhin funktionieren
- Minimale Anderungen in den UI-Komponenten notig

### 4. Episoden
- AniList liefert Episoden-Streaming-Links direkt mit
- Episode-Titel werden aus AniList bezogen
- Filler/Recap-Markierungen sind in AniList nicht vorhanden (werden entfernt oder aus externer Quelle ergänzt)

### 5. MAL-Import
- Die `mal-import` Edge Function bleibt unverandert (nutzt MAL direkt)
- Importierte Anime werden uber die MAL-ID mit AniList verknupft

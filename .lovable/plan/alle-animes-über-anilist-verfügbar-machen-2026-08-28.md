# Alle Animes über AniList verfügbar machen

Aktuell enthält die Datenbank 76 Serien, 203 Staffeln und 4.971 Episoden – nur was manuell per `sync-anime` synchronisiert wurde. Ziel: der gesamte AniList-Katalog soll in der App durchsuchbar und aufrufbar sein, ohne die bestehende „Datenbank zuerst"-Architektur aufzugeben.

## Vorgehen in drei Stufen

### 1. Katalog-Import (Breite)
Eine neue Edge Function `sync-catalog` lädt den kompletten AniList-Katalog seitenweise (50 Einträge pro Query, `sort: POPULARITY_DESC`, `type: ANIME`) und legt für jeden Titel einen leichten Serien-Eintrag an: Titel (romaji/englisch/japanisch), Cover, Beschreibung, Genres, Status, Format, Jahr, Episodenanzahl, AniList-ID.

- Läuft in Batches (z. B. 20 Seiten pro Aufruf), damit das Zeitlimit der Function nicht überschritten wird.
- Der Fortschritt (letzte Seite) wird in einer neuen Tabelle `sync_state` gespeichert – der nächste Aufruf macht dort weiter.
- Rate-Limit-freundlich: kurze Pause zwischen den Queries, Retry bei 429.
- Erwarteter Umfang: rund 20.000+ Serien (bzw. eine wählbare Obergrenze, z. B. nur Einträge mit Popularität > X, um Karteileichen auszuschließen).

### 2. Detail-Sync bei Bedarf (Tiefe)
Katalog-Einträge haben zunächst keine Staffel-Kette, keine TMDB-Bilder, keine Episoden. Sobald ein Nutzer eine Detailseite öffnet und dort noch keine Staffeln existieren, wird der bestehende `sync-anime`-Ablauf (Sequel-/Prequel-Kette + TMDB) automatisch im Hintergrund angestoßen. Die Seite zeigt so lange einen Ladezustand und aktualisiert sich danach.

So bleibt es bei der Regel „Frontend liest nur aus der Datenbank" – nachgeladen wird ausschließlich im Backend.

### 3. Aufräumen & Aktualität
- Ein wiederholbarer Aufruf von `sync-catalog` aktualisiert bestehende Einträge (Status, Episodenzahl, Cover) statt Duplikate zu erzeugen.
- Die Zusammenführungs-Logik aus `sync-anime` (Staffeln einer Kette in einem Eintrag, wie bei Bleach/Tokyo Ghoul) greift weiterhin und räumt Katalog-Duplikate beim Detail-Sync auf.

## Technische Details

| Bereich | Änderung |
|---|---|
| Datenbank | Neue Tabelle `sync_state` (Job-Name, letzte Seite, Zeitstempel, Status). Neue Spalten auf `series`: `format`, `year`, `episode_count`, `popularity`, `detail_synced_at` |
| Neue Function | `supabase/functions/sync-catalog/index.ts` – AniList-Paging, Batch-Upsert in `series`, Fortschritt in `sync_state` |
| Bestehende Function | `sync-anime` bleibt unverändert in der Logik, wird aber zusätzlich vom Frontend/Detail-Sync ausgelöst |
| Frontend | `useSeriesByAnilistId` / Detailseite: fehlt die Staffel-Kette, `sync-anime` aufrufen und danach neu laden. Suche & Startseite bleiben unverändert (lesen aus `series`) |
| Suche | Volltext-Index auf `series.title`, `title_en`, `title_jp`, damit die Suche bei 20.000+ Einträgen schnell bleibt; Limit + Sortierung nach Popularität |

## Offene Punkte
- Der Erstimport dauert je nach Umfang mehrere Durchläufe (AniList erlaubt ca. 90 Anfragen/Minute). Ich starte ihn nach dem Deploy in mehreren Batches.
- Genres/Filter auf der Startseite werden nach dem Import deutlich umfangreicher – ggf. lohnt anschließend eine Sortierung nach Popularität statt alphabetisch.

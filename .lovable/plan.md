# Roadmap: Tracking robuster machen

Ziel: Der Serien-Fortschritt gehört in die Datenbank statt in den Browser-Speicher, damit er auf Handy, Tablet und Desktop identisch ist – und daraus lassen sich danach Statistiken, Kalender und "Weiterschauen" speisen.

## Ausgangslage (geprüft)

- Auf der Anime-Detailseite werden gesehene Folgen ausschließlich lokal im Browser gespeichert (Schlüssel `watchedEpisodes_<animeId>`). Auf einem zweiten Gerät ist der Fortschritt leer.
- Der Schlüssel enthält keine Staffel: Folge 1 von Staffel 1 und Folge 1 von Staffel 2 gelten als dieselbe Folge.
- Es gibt bereits zwei Fortschritts-Tabellen, beide sind aktuell leer: `episode_progress` (pro Folge) und `user_progress` (pro Staffel). `episode_progress` speichert die Staffel als Zahl, die Staffeln selbst haben aber eine ID im UUID-Format – die vorhandene Hilfsfunktion `useEpisodeProgress` passt deshalb nicht zum Datenmodell und wird nirgends verwendet.
- `anime_tracking` (25 Einträge) hält Status und "aktuelle Folge", wird aber aus dem lokalen Zähler gefüttert.

## Etappe 1 – Fundament: Fortschritt in der Datenbank

- `episode_progress` auf das echte Staffel-Format umstellen (Staffel-Verweis als UUID mit Fremdschlüssel auf die Staffel, eindeutig pro Nutzer/Staffel/Folgennummer). Tabelle ist leer, es gehen keine Daten verloren.
- Zugriffsregeln bleiben: nur der Besitzer sieht und ändert seinen Fortschritt.
- `useEpisodeProgress` entsprechend korrigieren (Staffel-UUID statt Zahl) inklusive "alle als gesehen/ungesehen markieren".
- Detailseite auf diese Hooks umstellen; der Browser-Speicher wird beim ersten Laden einmalig migriert (vorhandene Häkchen der ersten Staffel zuordnen) und danach nicht mehr geschrieben.
- Für nicht angemeldete Besucher: Häkchen führen wie bisher zur Anmeldeaufforderung.

## Etappe 2 – Abgeleiteter Serien-Status

- Fortschritt pro Staffel in `user_progress` fortschreiben (gesehene Folgen, Status) und `anime_tracking.current_episode` aus der Datenbank statt aus dem lokalen Zähler berechnen.
- Automatik: letzte Folge einer Serie abgehakt → Vorschlag/Umschalten auf "Abgeschlossen"; erste Folge abgehakt → "Am schauen", wenn der Anime bisher nur geplant war.
- Fortschrittsbalken und Zähler auf Detailseite und im Profil aus derselben Quelle speisen.

## Etappe 3 – "Weiterschauen" und Kalender-Anschluss

- Auf der Startseite eine Sektion "Weiterschauen" mit der jeweils nächsten offenen Folge je laufender Serie, direkt abhakbar.
- Im Profil je Serie "nächste Folge" statt nur Statuszahl.
- Kalender markiert Folgen, die schon gesehen sind, und hebt Rückstand hervor ("3 Folgen offen").

## Etappe 4 – Statistiken

- Persönliche Auswertung im Profil: gesehene Folgen, geschätzte Watch-Zeit (aus Folgenlänge), Lieblingsgenres, Aktivität pro Monat.
- Basis ist ausschließlich der Datenbank-Fortschritt aus Etappe 1.

## Technische Details

- Migration: `episode_progress.season_id` von `integer` auf `uuid` mit Fremdschlüssel auf `seasons(id)` ändern, alte Unique-Constraints ersetzen durch eine eindeutige Kombination aus Nutzer, Staffel und Folgennummer, Index auf Nutzer + Anime.
- Betroffene Dateien: `src/hooks/useEpisodeProgress.ts`, `src/pages/AnimeDetailPage.tsx`, `src/hooks/useTracking.ts`, `src/pages/ProfilePage.tsx`, `src/pages/Index.tsx`, `src/pages/CalendarPage.tsx`.
- Die bereits vorhandene, aber ungenutzte Komponente `EpisodeList` wird beim Umbau der Detailseite als Anzeige-Komponente wiederverwendet, statt eine dritte Episodenliste zu pflegen.
- Reihenfolge der Umsetzung: Migration → Hooks → Detailseite → Profil/Start/Kalender → Statistiken. Jede Etappe bleibt für sich lauffähig.

## Umfang dieses Schritts

Nach Freigabe setze ich Etappe 1 vollständig um; Etappen 2–4 folgen danach auf Zuruf.

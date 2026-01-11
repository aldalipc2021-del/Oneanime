import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type LegalSection = "agb" | "datenschutz" | "cookies" | "impressum";

const legalContent: Record<LegalSection, { title: string; content: JSX.Element }> = {
  agb: {
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Geltungsbereich</h2>
          <p className="text-muted-foreground">
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der OneAnime-Plattform 
            (nachfolgend "Dienst" genannt). Mit der Registrierung und Nutzung des Dienstes 
            akzeptieren Sie diese Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Leistungsbeschreibung</h2>
          <p className="text-muted-foreground">
            OneAnime bietet eine kostenlose Plattform zur Verwaltung und Entdeckung von Anime. 
            Der Dienst umfasst Anime-Tracking, Bewertungen, Kommentare und 
            personalisierte Empfehlungen. Wir stellen keine Inhalte zum Streaming bereit.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Nutzerkonto</h2>
          <p className="text-muted-foreground">
            Für die Nutzung bestimmter Funktionen ist eine Registrierung erforderlich. 
            Sie sind verantwortlich für die Sicherheit Ihrer Zugangsdaten und alle 
            Aktivitäten unter Ihrem Konto. Die Weitergabe von Zugangsdaten ist untersagt.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Nutzerverhalten</h2>
          <p className="text-muted-foreground">
            Nutzer verpflichten sich, keine rechtswidrigen, beleidigenden oder 
            diskriminierenden Inhalte zu veröffentlichen. Verstöße können zur 
            Sperrung des Kontos führen. Die Nutzung von automatisierten Systemen 
            zum Abrufen von Daten ist ohne Genehmigung untersagt.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            Der Dienst wird "wie besehen" bereitgestellt. Wir übernehmen keine 
            Garantie für die Verfügbarkeit oder Fehlerfreiheit. Für Schäden, 
            die durch die Nutzung entstehen, haften wir nur bei Vorsatz oder 
            grober Fahrlässigkeit.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Änderungen der AGB</h2>
          <p className="text-muted-foreground">
            Wir behalten uns vor, diese AGB jederzeit zu ändern. Änderungen werden 
            auf der Plattform bekannt gegeben. Die weitere Nutzung nach Änderungen 
            gilt als Zustimmung.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Schlussbestimmungen</h2>
          <p className="text-muted-foreground">
            Es gilt deutsches Recht. Sollten einzelne Bestimmungen unwirksam sein, 
            bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </section>
      </div>
    ),
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenverarbeitung auf dieser Plattform ist der 
            Betreiber von OneAnime. Bei Fragen zum Datenschutz kontaktieren Sie uns 
            über die angegebenen Kontaktdaten.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Erhobene Daten</h2>
          <p className="text-muted-foreground">
            Wir erheben folgende personenbezogene Daten:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>E-Mail-Adresse (bei Registrierung)</li>
            <li>Anzeigename (optional)</li>
            <li>Spracheinstellungen und Land</li>
            <li>Anime-Watchlist und Bewertungen</li>
            <li>Kommentare</li>
            <li>Push-Notification-Token (optional)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Zweck der Verarbeitung</h2>
          <p className="text-muted-foreground">
            Ihre Daten werden verarbeitet für:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Bereitstellung und Personalisierung des Dienstes</li>
            <li>Speicherung Ihrer Anime-Präferenzen</li>
            <li>Versand von Push-Benachrichtigungen (falls aktiviert)</li>
            <li>Verbesserung unserer Dienste</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Rechtsgrundlage</h2>
          <p className="text-muted-foreground">
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO 
            (Einwilligung), Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und 
            Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Datenweitergabe</h2>
          <p className="text-muted-foreground">
            Ihre Daten werden nicht an Dritte verkauft. Eine Weitergabe erfolgt nur 
            an technische Dienstleister, die für den Betrieb notwendig sind (z.B. 
            Hosting-Anbieter), und diese sind vertraglich zur Einhaltung des 
            Datenschutzes verpflichtet.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Ihre Rechte</h2>
          <p className="text-muted-foreground">
            Sie haben das Recht auf:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Auskunft über Ihre gespeicherten Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung Ihrer Daten</li>
            <li>Einschränkung der Verarbeitung</li>
            <li>Datenübertragbarkeit</li>
            <li>Widerruf Ihrer Einwilligung</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten 
            vor unbefugtem Zugriff zu schützen. Die Übertragung erfolgt verschlüsselt 
            über HTTPS.
          </p>
        </section>
      </div>
    ),
  },
  cookies: {
    title: "Cookie-Richtlinie",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Was sind Cookies?</h2>
          <p className="text-muted-foreground">
            Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, 
            um bestimmte Funktionen zu ermöglichen und Ihre Nutzererfahrung zu verbessern.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Verwendete Cookies</h2>
          <p className="text-muted-foreground">
            Wir verwenden folgende Arten von Cookies:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li><strong>Notwendige Cookies:</strong> Für die Grundfunktionen der Website erforderlich (z.B. Authentifizierung)</li>
            <li><strong>Funktionale Cookies:</strong> Speichern Ihre Präferenzen wie Spracheinstellungen und Theme</li>
            <li><strong>Lokaler Speicher:</strong> Speichert Ihre Sitzungsdaten sicher im Browser</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Keine Tracking-Cookies</h2>
          <p className="text-muted-foreground">
            Wir verwenden keine Tracking- oder Werbe-Cookies. Wir setzen keine 
            Drittanbieter-Cookies zu Marketingzwecken ein.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Cookie-Einstellungen</h2>
          <p className="text-muted-foreground">
            Sie können Cookies in Ihren Browsereinstellungen verwalten oder löschen. 
            Beachten Sie, dass das Deaktivieren von Cookies die Funktionalität 
            der Website einschränken kann.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Speicherdauer</h2>
          <p className="text-muted-foreground">
            Sitzungs-Cookies werden gelöscht, wenn Sie Ihren Browser schließen. 
            Dauerhafte Cookies (für Präferenzen) bleiben bis zu ihrer Löschung 
            oder für maximal 1 Jahr gespeichert.
          </p>
        </section>
      </div>
    ),
  },
  impressum: {
    title: "Impressum",
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
          <p className="text-muted-foreground">
            OneAnime<br />
            [Adresse auf Anfrage]<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Kontakt</h2>
          <p className="text-muted-foreground">
            E-Mail: contact@oneanime.app
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Haftung für Inhalte</h2>
          <p className="text-muted-foreground">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte 
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach 
            §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, 
            übermittelte oder gespeicherte fremde Informationen zu überwachen oder 
            nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Haftung für Links</h2>
          <p className="text-muted-foreground">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren 
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden 
            Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten 
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten 
            verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Urheberrecht</h2>
          <p className="text-muted-foreground">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen 
            Seiten unterliegen dem deutschen Urheberrecht. Anime-Bilder und -Daten 
            stammen von der Jikan API (MyAnimeList) und unterliegen deren jeweiligen 
            Nutzungsbedingungen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Streitschlichtung</h2>
          <p className="text-muted-foreground">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung 
            (OS) bereit: https://ec.europa.eu/consumers/odr/. Wir sind nicht bereit 
            oder verpflichtet, an Streitbeilegungsverfahren vor einer 
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    ),
  },
};

const LegalPage = () => {
  const { section } = useParams<{ section: string }>();
  const legalSection = section as LegalSection;
  
  const content = legalContent[legalSection];

  if (!content) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">Seite nicht gefunden</h1>
        <Link to="/">
          <Button variant="outline">Zur Startseite</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Zurück zur Startseite
      </Link>
      
      <h1 className="mb-8 text-3xl font-bold">{content.title}</h1>
      
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {content.content}
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Stand: Januar 2026
        </p>
      </div>
    </div>
  );
};

export default LegalPage;
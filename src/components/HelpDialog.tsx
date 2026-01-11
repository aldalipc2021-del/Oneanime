import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Wie kann ich ein Anime zu meiner Liste hinzufügen?",
    answer:
      "Gehe zur Suchseite, suche nach dem gewünschten Anime und klicke auf 'Hinzufügen'. Du kannst dann den Status wählen (Am schauen, Geplant, Abgeschlossen).",
  },
  {
    question: "Wie kann ich Benachrichtigungen aktivieren?",
    answer:
      "Gehe zu Einstellungen > Alle Einstellungen > Push-Benachrichtigungen und schalte diese ein. Du erhältst dann Benachrichtigungen für neue Episoden deiner verfolgten Anime.",
  },
  {
    question: "Kann ich meine Sprache ändern?",
    answer:
      "Ja! Gehe zu Einstellungen > Alle Einstellungen und wähle deine bevorzugte Sprache (Deutsch, Englisch, Japanisch, Französisch oder Spanisch).",
  },
  {
    question: "Wie funktioniert die Übersetzung von Beschreibungen?",
    answer:
      "Du kannst in den Einstellungen die automatische Übersetzung von Anime-Beschreibungen aktivieren. Dies hilft, Beschreibungen in deiner Sprache zu verstehen.",
  },
  {
    question: "Was bedeutet 'Filme als Staffel'?",
    answer:
      "Wenn diese Option aktiviert ist, werden Filme eines Anime-Franchises zusammen mit der Serie angezeigt. Dies ist nützlich, wenn du alles von einem Franchise an einem Ort sehen möchtest.",
  },
  {
    question: "Wie kann ich meine persönlichen Listen erstellen?",
    answer:
      "In deinem Profil findest du den Bereich 'Meine Listen', wo du benutzerdefinierte Listen erstellen und deine Lieblings-Anime organisieren kannst.",
  },
  {
    question: "Funktioniert die App offline?",
    answer:
      "Die meisten Funktionen erfordern eine Internetverbindung. Jedoch werden einige Daten lokal gespeichert und sind auch offline verfügbar.",
  },
  {
    question: "Wie kann ich meinen Account löschen?",
    answer:
      "Kontaktiere uns unter support@oneanime.de mit deiner Anfrage zur Kontolöschung. Wir werden deinen Account und all deine Daten dauerhaft löschen.",
  },
];

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Hilfe & Häufig gestellte Fragen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* FAQ Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              HÄUFIG GESTELLTE FRAGEN
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => toggleFAQ(index)}
                  className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{faq.question}</p>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        expandedIndex === index && "rotate-180"
                      )}
                    />
                  </div>
                  {expandedIndex === index && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              WEITERE RESSOURCEN
            </h3>
            <div className="space-y-2">
              <a
                href="https://docs.oneanime.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Dokumentation & Anleitung</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a
                href="https://community.oneanime.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Community & Forum</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              KONTAKT & SUPPORT
            </h3>
            <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Email Support
                </p>
                <a
                  href="mailto:support@oneanime.de"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  support@oneanime.de
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Bugs melden
                </p>
                <a
                  href="https://github.com/oneanime/bugs/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub Issue Tracker
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Feature-Anfragen
                </p>
                <a
                  href="https://github.com/oneanime/features/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Discussions
                </a>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              APP-INFORMATIONEN
            </h3>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Zuletzt aktualisiert</span>
                <span className="font-medium text-foreground">11. Januar 2026</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 text-green-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Aktiv
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="hidden md:block border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gradient-primary">OneAnime</span>
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              { to: "/legal/impressum", label: "Impressum" },
              { to: "/legal/agb", label: "AGB" },
              { to: "/legal/datenschutz", label: "Datenschutz" },
              { to: "/legal/cookies", label: "Cookies" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Mit <Heart className="h-3 w-3 fill-primary text-primary" /> erstellt
          </p>
        </div>
      </div>
    </footer>
  );
};

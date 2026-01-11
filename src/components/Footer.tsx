import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">OneAnime</span>
            <span className="text-sm text-muted-foreground">© 2026</span>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              to="/legal/impressum" 
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Impressum
            </Link>
            <Link 
              to="/legal/agb" 
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              AGB
            </Link>
            <Link 
              to="/legal/datenschutz" 
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Datenschutz
            </Link>
            <Link 
              to="/legal/cookies" 
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
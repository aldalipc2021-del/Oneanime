import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, User, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Suche", path: "/search" },
  { icon: Calendar, label: "Kalender", path: "/calendar" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInHeader, setShowSearchInHeader] = useState(false);
  const { user, signOut, profile } = useAuth();

  // Detect scroll to show search icon on homepage
  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === "/") {
        setShowSearchInHeader(window.scrollY > 150);
      } else {
        setShowSearchInHeader(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <nav className="glass-card flex items-center justify-between px-6 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImage} alt="OneAnime Logo" className="h-10 w-10 rounded-xl shadow-lg shadow-primary/30" />
              <span className="text-xl font-bold text-foreground">
                One<span className="text-gradient">Anime</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {profile?.display_name || user.email?.split("@")[0]}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="gradient" size="sm">
                  Anmelden
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] md:hidden">
        <div className="glass-card mx-4 mt-2 flex items-center justify-between rounded-2xl px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="OneAnime Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold">
              One<span className="text-gradient">Anime</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Search icon - appears when scrolled on homepage */}
            {showSearchInHeader && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/search")}
                className="animate-fade-in"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="glass-card mx-4 mt-2 animate-fade-in rounded-2xl p-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-border" />
              {user ? (
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">
                    Anmelden
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass-card mx-4 mb-4 flex items-center justify-around rounded-2xl px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

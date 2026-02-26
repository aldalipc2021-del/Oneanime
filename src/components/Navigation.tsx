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
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, profile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (location.pathname === "/") {
        setShowSearchInHeader(window.scrollY > 150);
      } else {
        setShowSearchInHeader(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 hidden md:block transition-all duration-300",
        scrolled && "backdrop-blur-xl"
      )}>
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className={cn(
            "flex items-center justify-between rounded-2xl px-6 py-3 transition-all duration-500",
            scrolled
              ? "glass-card shadow-lg"
              : "bg-transparent"
          )}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logoImage}
                alt="OneAnime Logo"
                className="h-10 w-10 rounded-xl shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              />
              <span className="text-xl font-bold text-foreground">
                One<span className="text-gradient-primary">Anime</span>
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
                      "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 transition-transform duration-300", isActive && "scale-110")} />
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                    )}
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
                <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
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
        <div className={cn(
          "mx-4 mt-2 flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300",
          scrolled ? "glass-card shadow-lg" : "bg-background/60 backdrop-blur-md"
        )}>
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="OneAnime Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold">
              One<span className="text-gradient-primary">Anime</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
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
              <div className="relative h-5 w-5">
                <Menu className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  mobileMenuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                )} />
                <X className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  mobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                )} />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "mx-4 mt-2 overflow-hidden rounded-2xl transition-all duration-300",
          mobileMenuOpen
            ? "glass-card max-h-96 opacity-100 scale-100 p-4"
            : "max-h-0 opacity-0 scale-95 p-0"
        )}>
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
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="glass-card mx-4 mb-3 flex items-center justify-around rounded-2xl px-2 py-1.5 shadow-xl shadow-background/50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground active:scale-95"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

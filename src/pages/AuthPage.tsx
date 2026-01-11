import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { z } from "zod";

type AuthMode = "login" | "register" | "forgot";

const emailSchema = z.string().email("Ungültige E-Mail-Adresse").max(255, "E-Mail zu lang");
const passwordSchema = z.string().min(6, "Passwort muss mindestens 6 Zeichen haben").max(100, "Passwort zu lang");
const nameSchema = z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(50, "Name zu lang");

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    if (mode !== "forgot") {
      try {
        passwordSchema.parse(formData.password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }

    if (mode === "register") {
      try {
        nameSchema.parse(formData.name);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwörter stimmen nicht überein";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Anmeldung fehlgeschlagen",
              description: "E-Mail oder Passwort ist falsch.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fehler",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Anmeldung erfolgreich",
            description: "Willkommen zurück bei OneAnime!",
          });
          navigate("/");
        }
      } else if (mode === "register") {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "E-Mail bereits registriert",
              description: "Diese E-Mail-Adresse ist bereits vergeben.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fehler",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Registrierung erfolgreich",
            description: "Willkommen bei OneAnime!",
          });
          navigate("/");
        }
      } else {
        const { error } = await resetPassword(formData.email);
        if (error) {
          toast({
            title: "Fehler",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "E-Mail gesendet",
            description: "Prüfe dein Postfach für weitere Anweisungen.",
          });
          setMode("login");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-lg shadow-primary/30">
            <span className="text-2xl font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-2xl font-bold">
            One<span className="text-gradient">Anime</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          {/* Back Button for forgot password */}
          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Anmeldung
            </button>
          )}

          {/* Title */}
          <h1 className="mb-2 text-center text-2xl font-bold">
            {mode === "login" && "Willkommen zurück"}
            {mode === "register" && "Konto erstellen"}
            {mode === "forgot" && "Passwort zurücksetzen"}
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {mode === "login" && "Melde dich an, um deine Anime zu tracken"}
            {mode === "register" && "Erstelle ein Konto, um loszulegen"}
            {mode === "forgot" && "Gib deine E-Mail ein, um dein Passwort zurückzusetzen"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-11"
                    required
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11"
                  required
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-11 pr-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>
            )}

            {mode === "register" && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort bestätigen"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-11"
                    required
                    minLength={6}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="block w-full text-right text-sm text-primary transition-colors hover:text-primary/80"
              >
                Passwort vergessen?
              </button>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "login" ? (
                "Anmelden"
              ) : mode === "register" ? (
                "Registrieren"
              ) : (
                "Link senden"
              )}
            </Button>
          </form>

          {/* Divider */}
          {mode !== "forgot" && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oder</span>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          {mode !== "forgot" && <GoogleSignInButton />}

          {/* Toggle Mode */}
          {mode !== "forgot" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Noch kein Konto?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Jetzt registrieren
                  </button>
                </>
              ) : (
                <>
                  Bereits ein Konto?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Jetzt anmelden
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* Info Text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Mit der Anmeldung stimmst du unseren Nutzungsbedingungen zu.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

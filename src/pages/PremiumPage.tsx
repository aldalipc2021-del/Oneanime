import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsPremium } from "@/hooks/useSubscription";
import {
  Check,
  Crown,
  Sparkles,
  List,
  Ban,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: List, text: "Unbegrenzte eigene Listen erstellen" },
  { icon: Ban, text: "Keine Werbung" },
  { icon: Star, text: "Exklusive Features" },
  { icon: Crown, text: "Premium-Badge im Profil" },
];

const plans = [
  {
    id: "monthly",
    name: "Monatlich",
    price: "3,00 €",
    period: "/Monat",
    popular: false,
  },
  {
    id: "yearly",
    name: "Jährlich",
    price: "30,00 €",
    period: "/Jahr",
    popular: true,
    savings: "Spare 17%",
  },
];

const PremiumPage = () => {
  const { user } = useAuth();
  const { isPremium, isLoading } = useIsPremium();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-3xl font-bold">Du bist Premium!</h1>
          <p className="text-muted-foreground">
            Danke, dass du OneAnime unterstützt. Du genießt alle Premium-Vorteile.
          </p>
          <Link to="/profile">
            <Button variant="outline" className="mt-6">
              Zurück zum Profil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 md:px-6">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Premium Mitgliedschaft
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Erlebe <span className="text-gradient">OneAnime</span> ohne Limits
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Unterstütze uns und genieße exklusive Vorteile wie keine Werbung und unbegrenzte Listen.
          </p>
        </div>

        {/* Features */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border p-6",
                plan.popular
                  ? "border-primary bg-gradient-to-b from-primary/5 to-transparent"
                  : "border-border bg-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Beliebt
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {plan.savings && (
                  <span className="text-sm text-primary">{plan.savings}</span>
                )}
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-6 space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className="w-full"
                  disabled
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Bald verfügbar
                </Button>
              ) : (
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full">
                    Erst anmelden
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-center text-sm text-muted-foreground">
          Die Zahlungsmethode wird bald freigeschaltet. Du kannst dich schon vormerken lassen!
        </p>
      </div>
    </div>
  );
};

export default PremiumPage;

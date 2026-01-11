import { cn } from "@/lib/utils";
import { useIsPremium } from "@/hooks/useSubscription";

interface AdBannerProps {
  variant?: "horizontal" | "square" | "leaderboard";
  className?: string;
}

export const AdBanner = ({ variant = "horizontal", className }: AdBannerProps) => {
  const { isPremium, isLoading } = useIsPremium();

  // Don't show ads to premium users
  if (isLoading || isPremium) return null;

  const dimensions = {
    horizontal: "h-24 md:h-20",
    square: "h-64 w-64",
    leaderboard: "h-24 w-full max-w-[728px]",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground",
        dimensions[variant],
        className
      )}
    >
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider opacity-50">
          Werbung
        </p>
        <p className="mt-1 text-[10px] opacity-40">
          Werde Premium, um Werbung zu entfernen
        </p>
      </div>
    </div>
  );
};

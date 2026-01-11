import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export const StarRating = ({ 
  value, 
  onChange, 
  readonly = false,
  size = "md",
  showValue = true
}: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readonly || !onChange) return;
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent, starIndex: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className={cn("flex", !readonly && "cursor-pointer")}
        onMouseLeave={() => setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fillAmount = Math.min(1, Math.max(0, displayValue - starIndex));
          
          return (
            <div
              key={starIndex}
              className="relative"
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isHalf = x < rect.width / 2;
                handleClick(starIndex, isHalf);
              }}
            >
              {/* Background star (empty) */}
              <Star 
                className={cn(
                  sizeClasses[size],
                  "text-muted-foreground/30"
                )} 
              />
              {/* Filled portion */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <Star 
                  className={cn(
                    sizeClasses[size],
                    "fill-primary text-primary"
                  )} 
                />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn(
          "font-semibold text-foreground",
          size === "sm" && "text-sm",
          size === "lg" && "text-lg"
        )}>
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};

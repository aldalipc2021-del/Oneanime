import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export interface StreamingLink {
  name: string;
  url: string;
}

// Mapping of streaming service names to their logos/icons
export const streamingServiceInfo: Record<string, { logo: string; color: string }> = {
  "Crunchyroll": { logo: "🍊", color: "bg-orange-500" },
  "Netflix": { logo: "🎬", color: "bg-red-600" },
  "Amazon Prime Video": { logo: "📺", color: "bg-blue-500" },
  "Disney+": { logo: "✨", color: "bg-blue-700" },
  "Hulu": { logo: "🟢", color: "bg-green-500" },
  "Funimation": { logo: "🔵", color: "bg-purple-600" },
  "Wakanim": { logo: "🔴", color: "bg-red-500" },
  "ADN": { logo: "🎌", color: "bg-red-700" },
  "Aniwatch": { logo: "📱", color: "bg-cyan-500" },
  "Bilibili": { logo: "📺", color: "bg-cyan-400" },
};

export const useAnimeStreamingLinks = (animeId: number) => {
  return useQuery({
    queryKey: ["animeStreaming", animeId],
    queryFn: async (): Promise<StreamingLink[]> => {
      const response = await fetch(`${JIKAN_BASE_URL}/anime/${animeId}/streaming`);
      if (!response.ok) throw new Error("Failed to fetch streaming links");
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!animeId,
  });
};

// Filter streaming services based on user's country
export const filterStreamingByCountry = (
  links: StreamingLink[],
  country: string
): StreamingLink[] => {
  // For now, return all links - in production you'd filter by region
  // German users typically have access to: Crunchyroll, Netflix, Amazon Prime, Wakanim
  const germanServices = ["Crunchyroll", "Netflix", "Amazon Prime Video", "Wakanim", "ADN"];
  
  if (country === "DE" || country === "AT" || country === "CH") {
    return links.filter(link => 
      germanServices.some(service => link.name.includes(service)) || 
      !germanServices.some(service => !link.name.includes(service))
    );
  }
  
  return links;
};

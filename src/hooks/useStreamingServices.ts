import { useQuery } from "@tanstack/react-query";

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
  "Disney Plus": { logo: "✨", color: "bg-blue-700" },
  "Hulu": { logo: "🟢", color: "bg-green-500" },
  "Funimation": { logo: "🔵", color: "bg-purple-600" },
  "Wakanim": { logo: "🔴", color: "bg-red-500" },
  "ADN": { logo: "🎌", color: "bg-red-700" },
  "Bilibili": { logo: "📺", color: "bg-cyan-400" },
  "HIDIVE": { logo: "📱", color: "bg-blue-500" },
  "VRV": { logo: "📺", color: "bg-yellow-500" },
};

// This hook now uses data from AniList's streamingEpisodes/externalLinks
// passed through the anime detail page
export const useAnimeStreamingLinks = (animeId: number, streamingEpisodes?: any[], externalLinks?: any[]) => {
  return useQuery({
    queryKey: ["animeStreaming", animeId],
    queryFn: async (): Promise<StreamingLink[]> => {
      const links: StreamingLink[] = [];
      const seenSites = new Set<string>();

      // Extract from streaming episodes
      if (streamingEpisodes) {
        for (const ep of streamingEpisodes) {
          if (ep.site && ep.url && !seenSites.has(ep.site)) {
            seenSites.add(ep.site);
            links.push({ name: ep.site, url: ep.url });
          }
        }
      }

      // Extract from external links (STREAMING type)
      if (externalLinks) {
        for (const link of externalLinks) {
          if (link.type === "STREAMING" && link.site && link.url && !seenSites.has(link.site)) {
            seenSites.add(link.site);
            links.push({ name: link.site, url: link.url });
          }
        }
      }

      // If no AniList data available, try Jikan as fallback
      if (links.length === 0 && animeId) {
        try {
          const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/streaming`);
          if (response.ok) {
            const data = await response.json();
            return data.data || [];
          }
        } catch {
          // Ignore
        }
      }

      return links;
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!animeId,
  });
};

// Filter streaming services based on user's country
export const filterStreamingByCountry = (
  links: StreamingLink[],
  country: string
): StreamingLink[] => {
  const germanServices = ["Crunchyroll", "Netflix", "Amazon Prime Video", "Wakanim", "ADN"];

  if (country === "DE" || country === "AT" || country === "CH") {
    return links.filter(link =>
      germanServices.some(service => link.name.includes(service)) ||
      !germanServices.some(service => !link.name.includes(service))
    );
  }

  return links;
};

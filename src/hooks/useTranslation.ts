import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

export const useTranslation = () => {
  const { profile } = useAuth();
  const [isTranslating, setIsTranslating] = useState(false);
  const [localLang, setLocalLang] = useState(localStorage.getItem("settings_language") || "de");

  // Höre auf Änderungen im LocalStorage (wenn SettingsDialog speichert)
  useEffect(() => {
    const handleStorageChange = () => {
      setLocalLang(localStorage.getItem("settings_language") || "de");
    };
    window.addEventListener("local-settings-changed", handleStorageChange);
    return () => window.removeEventListener("local-settings-changed", handleStorageChange);
  }, []);

  const translateText = useCallback(async (
    text: string,
    targetLanguage?: string
  ): Promise<string> => {
    // Nutze Profil-Sprache ODER lokale Sprache
    const lang = targetLanguage || profile?.preferred_language || localStorage.getItem("settings_language") || "de";
    
    // Don't translate if already in target language or text is empty
    if (!text || text.trim() === "") return text;
    
    // Check cache
    const cacheKey = `${text.substring(0, 50)}_`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // If language is English or Japanese, likely no translation needed for anime descriptions
    if (lang === "en" || lang === "ja") {
      return text;
    }

    setIsTranslating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { text, targetLanguage: lang },
      });

      if (error) throw error;
      
      const translatedText = data?.translation || text;
      
      // Cache the result
      translationCache[cacheKey] = translatedText;
      
      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [profile?.preferred_language, localLang]); // localLang als Dependency hinzufügen

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      de: "Deutsch",
      en: "English",
      ja: "日本語",
      fr: "Français",
      es: "Español",
    };
    return names[code] || code;
  };

  return {
    translateText,
    isTranslating,
    currentLanguage: profile?.preferred_language || localLang,
    getLanguageName,
  };
};

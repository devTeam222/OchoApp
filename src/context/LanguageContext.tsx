"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { allVocabularyKeys, vocabulary, VocabularyKey } from "@/lib/vocabulary";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useSession } from "@/app/(main)/SessionProvider";

// Types des langues
type Language = "en" | "fr";
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

// Contexte initial
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");
  const { user } = useSession();
  const router = useRouter();

  const userId = user.id || "guest";

  // Charger la langue au démarrage
  useEffect(() => {
    const browserLang = navigator.language.startsWith("fr") ? "fr" : "en";
    const storedLang =
      Cookies.get(`lang-${userId}`) ||
      localStorage.getItem(`lang-${userId}`) ||
      browserLang;

    const shortLang = storedLang.split("-")[0] as Language;
    setLanguage(shortLang as Language);

    // Sauvegarder la langue côté serveur (cookie) si non défini
    if (!Cookies.get(`lang-${userId}`)) {
      Cookies.set(`lang-${userId}`, shortLang, { expires: 365 });
    }
  }, [userId]);

  // Mettre à jour la langue côté client et serveur
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(`lang-${userId}`, lang);
    Cookies.set(`lang-${userId}`, lang, { expires: 365 });
    router.refresh(); // Recharger pour refléter la nouvelle langue si nécessaire
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook pour utiliser le contexte de langue
export const useLanguage = () => useContext(LanguageContext);

// Fonction pour récupérer une ou plusieurs traductions côté client
export const t = (
  keys: VocabularyKey | VocabularyKey[] = allVocabularyKeys,
): Record<string, string> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { language } = useLanguage();

  // Convertir une clé unique en tableau pour simplifier le traitement
  const keysArray = Array.isArray(keys) ? keys : [keys];

  // Construire un objet avec les traductions demandées
  return keysArray.reduce(
    (acc, key) => {
      acc[key] = vocabulary[language][key];

      return acc;
    },
    {} as Record<string, string>,
  );
};

import SetNavigation from "@/components/SetNavigation";
import TrendsSidebar from "@/components/TrendsSidebar";
import Options from "../Options";
import { t } from "@/context/LanguageContext";
import { VocabularyKey, getVocabularyObject } from "@/lib/vocabulary";
import { getTranslation } from "@/lib/language";

interface PageProps {
  params: { setting: string };
}

export default async function page({ params: { setting } } : PageProps) {

  const vocabulary: VocabularyKey[] = [
    "settings",
  ];

  const vocabularyObject = getVocabularyObject(vocabulary);
  type VocabularyObject = typeof vocabularyObject;

  const { settings }: VocabularyObject =
    await getTranslation(vocabulary);
        
  return (
    <>
      <SetNavigation navPage="settings" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-5 max-w-lg">
        <div className="bg-card/50 p-5 shadow-sm sm:rounded-2xl sm:bg-card">
          <h2 className="text-center text-2xl font-bold">{settings}</h2>
        </div>
        <Options setting={setting} subOption/>
      </div>
      <TrendsSidebar />
    </>
  );
}
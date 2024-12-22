import SetNavigation from "@/components/SetNavigation";
import TrendsSidebar from "@/components/TrendsSidebar";
import { PageProps } from "../../../../../.next/types/app/layout";
import Options from "../Options";

export default function page({ params: { setting } } : PageProps) {
        
  return (
    <>
      <SetNavigation navPage="settings" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-5 max-w-lg">
        <div className="bg-card/50 p-5 shadow-sm sm:rounded-2xl sm:bg-card">
          <h2 className="text-center text-2xl font-bold">Paramètres</h2>
        </div>
        <Options setting={setting} subOption/>
      </div>
      <TrendsSidebar />
    </>
  );
}
import SetNavigation from "@/components/SetNavigation";
import TrendsSidebar from "@/components/TrendsSidebar";
import Settings from "./Settings";

export default function page() {
  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:pb-4">
      <SetNavigation navPage="settings" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-5">
        <div className="bg-card/50 p-5 shadow-sm sm:rounded-2xl sm:bg-card">
          <h2 className="text-center text-2xl font-bold">Paramètres</h2>
        </div>
        <Settings />
      </div>
      <TrendsSidebar />
    </main>
  );
}

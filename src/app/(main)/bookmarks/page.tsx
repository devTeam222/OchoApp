import { Metadata } from "next";
import Bookmarks from "./Bookmarks";
import TrendsSidebar from "@/components/TrendsSidebar";
import SetNavigation from "@/components/SetNavigation";

export const metadata: Metadata = {
  title: "Favoris",
};

export default function Page() {
  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:pb-4">
      <SetNavigation navPage="bookmarks" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-5">
        <div className="sm:rounded-2xl bg-card/50 sm:bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">Favoris</h2>
        </div>
        <Bookmarks />
      </div>
      <TrendsSidebar />
    </main>
  );
}

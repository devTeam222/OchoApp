import { Metadata } from "next";
import Bookmarks from "./Bookmarks";
import TrendsSidebar from "@/components/TrendsSidebar";

export const metadata: Metadata = {
  title: "Favoris",
};

export default function Page() {
  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:p-4">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">Favoris</h2>
        </div>
        <Bookmarks />
      </div>
      <TrendsSidebar />
    </main>
  );
}

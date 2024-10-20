import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import { Search } from "lucide-react";
import SearchTrend from "@/components/search/SearchTrend";

interface PageProps {
  searchParams: { q: string };
}

export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
  return {
    title: q ? `Resultats de recherche pour "${q}"` : "Rehercher",
  };
}

export default function Page({ searchParams: { q } }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:p-4">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="line-clamp-2 break-all text-center text-2xl font-bold">
            {q ? `Resultats de recherche pour "${q}"` : "Recherche"}
          </h2>
        </div>
        {q ? (
          <SearchResults query={q} />
        ) : (
          <div className="my-8 w-full text-center text-muted-foreground flex flex-col gap-2 items-center max-sm:hidden">
            <Search size={150}/>
            <h2 className="text-xl">Veuillez saisir des mots clé dans votre recherche</h2>
          </div>
        )}
        <SearchTrend/>
      </div>
      <TrendsSidebar />
    </main>
  );
}

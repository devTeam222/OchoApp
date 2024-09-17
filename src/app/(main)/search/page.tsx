import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";

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
          <p className="my-8 w-full text-center text-muted-foreground">
            Veuillez saisir des mots clé dans votre recherche
          </p>
        )}
      </div>
      <TrendsSidebar />
    </main>
  );
}

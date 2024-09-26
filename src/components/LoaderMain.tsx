"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoaderMain() {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Définir un délai avant d'afficher le loader
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 10); // 10ms = 0,01 secondes

    // Nettoyer le timer quand le composant est démonté
    return () => clearTimeout(timer);
  }, []);

  return <Loader2 className={cn("animate-spin w-7 transition-all", showLoader ? "h-7": "h-0")} />;
}

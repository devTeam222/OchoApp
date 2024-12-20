"use client";

import { useEffect, useState } from "react";
import { TimeFormatter } from "@/lib/formatters";

interface TimeProps {
  time: Date;
  relative?: boolean;
  full?: boolean;
  long?: boolean;
  lowerCase?: boolean;
  upperCase?: boolean;
}

export default function Time({
  time,
  relative,
  full,
  long = false,
  lowerCase = false,
  upperCase = false,
}: TimeProps) {
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(navigator.language || "fr-FR");
  }, []);

  if (!language) {
    // Rendre un contenu temporaire ou un placeholder
    return <time>dd/mm/YYYY</time>;
  }

  const timeFormatter = new TimeFormatter(time, language, long, full, relative);
  const formatTime = timeFormatter.format();

  const formattedTime = !(lowerCase || upperCase)
    ? formatTime
    : lowerCase
      ? formatTime.toLowerCase()
      : formatTime.toUpperCase();

  return <time>{formattedTime}</time>;
}

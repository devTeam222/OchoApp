"use client";

import { useEffect, useState } from "react";
import { TimeFormatter } from "@/lib/formatters";

interface TimeProps {
  time: Date;
  relative?: boolean;
  full?: boolean;
}

export default function Time({ time, relative, full }: TimeProps) {
  const [language, setLanguage] = useState<string>("fr-FR");

  useEffect(() => {
    setLanguage(navigator.language || "fr-FR");
  }, []);

  const timeFormatter = new TimeFormatter(time, language, true, full);

  const formattedTime = relative
    ? timeFormatter.formatRelativeTime()
    : timeFormatter.formatTime();

  const oneMonthAgo = new Date(time.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isOneMonthAgo = oneMonthAgo.getTime() >= new Date().getTime();

  return (
    <time>
      {!relative && isOneMonthAgo && language.startsWith("fr") ? "le " : ""}
      {formattedTime}
    </time>
  );
}

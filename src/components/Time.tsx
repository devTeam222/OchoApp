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
  const [language, setLanguage] = useState<string>("fr-FR");

  useEffect(() => {
    setLanguage(navigator.language || "fr-FR");
  }, []);

  const timeFormatter = new TimeFormatter(time, language, long, full, relative);
  const formatTime = timeFormatter.format();

  const formattedTime = !(lowerCase || upperCase)
    ? formatTime
    : lowerCase
      ? formatTime.toLowerCase()
      : formatTime.toUpperCase();

  return <time>{formattedTime}</time>;
}

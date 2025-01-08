"use client";

import { useEffect, useState } from "react";
import GoogleSignInButton from "./GoogleSignInButton";
import GithubSignInButton from "./GithubSignInButton";
import { EmptySession } from "@/app/(main)/SessionProvider";
import { t } from "@/context/LanguageContext";

export default function Support() {
  return (
    <EmptySession>
      <AuthSupport />
    </EmptySession>
  );
}

function AuthSupport() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [isSameOrigin, setIsSameOrigin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { unsupportedEnv } = t();

  useEffect(() => {
    setIsLoading(false);
    if (baseUrl) {
      const currentUrl = window.location.origin;
      setIsSameOrigin(currentUrl === baseUrl);
    }
  }, [baseUrl]);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full justify-center gap-2">
        <GoogleSignInButton supported={isSameOrigin && !isLoading} />
        <GithubSignInButton supported={isSameOrigin && !isLoading} />
      </div>
      {!isLoading && !isSameOrigin && (
        <span className="text-center italic text-destructive text-sm">
          {unsupportedEnv}
        </span>
      )}
    </div>
  );
}

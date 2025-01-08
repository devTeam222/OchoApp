"use client";

import { useEffect, useState } from "react";
import GoogleSignInButton from "./GoogleSignInButton";
import GithubSignInButton from "./GithubSignInButton";

export default function Support() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [isSameOrigin, setIsSameOrigin] = useState(false);

  useEffect(() => {
    if (baseUrl) {
      const currentUrl = window.location.origin;
      setIsSameOrigin(currentUrl === baseUrl);
    }
  }, [baseUrl]);

  return <div className="w-full flex gap-2 justify-center">
    <GoogleSignInButton supported={isSameOrigin} />
    <GithubSignInButton supported={isSameOrigin} />
  </div>;
}

"use client";

import kyInstance from "@/lib/ky";
import { UserData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import Link from "next/link";
import { PropsWithChildren, useEffect, useState } from "react";
import UserTooltip from "./UserTooltip";
import { useSession } from "@/app/(main)/SessionProvider";

interface UserLinkWithTooltipProps extends PropsWithChildren {
  username: string;
  onFind?: (user: UserData)=> void;
}

export default function UserLinkWithTooltip({
  children,
  username,
  onFind,
}: UserLinkWithTooltipProps) {
  const [useDialog, setUseDialog] = useState(false);
  const { user } = useSession();

  useEffect(() => {
    const handleResize = () => {
      const isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      setUseDialog(isTouchScreen || isSmallScreen);
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data } = useQuery({
    queryKey: ["user-data", username],
    queryFn: () =>
      kyInstance.get(`/api/users/username/${username}`).json<UserData>(),
    retry(failureCount, error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: Infinity,
  });

  if (!data) {
    return (
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    );
  }
  if(onFind && (user.id !== data.id)) {
    onFind(data); 
  }
  return (
    <UserTooltip user={data}>
      {
        useDialog ? (<span className="text-primary hover:underline">{children}</span>) : (
        <Link
          href={`/users/${username}`}
          className="text-primary hover:underline"
        >
          {children}
        </Link>
        )
      }
    </UserTooltip>
  );
}

"use client";

import Image, { StaticImageData } from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";

interface UserAvatarProps {
  avatarUrl: string | StaticImageData | null | undefined;
  size?: number;
  className?: string;
  online?: boolean;
}

export default function UserAvatar({
  avatarUrl,
  size = 48,
  className,
  online = false,
}: UserAvatarProps) {
  let isImageErr = false;
  return (
    <span
      className={cn(
        `relative flex aspect-square h-fit min-h-fit w-fit min-w-fit items-center justify-center rounded-full bg-muted`,
        className,
      )}
    >
      <UserRound
        className={cn(
          "absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] rounded-full text-muted-foreground",
          avatarUrl && "pointer-events-none opacity-0",
        )}
        size={size > 32 ? size - 16 : size - 4}
      />
      <Image
        src={avatarUrl ?? avatarPlaceholder}
        alt=""
        className={cn(
          "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
          (!avatarUrl || isImageErr) && "pointer-events-none opacity-0",
        )}
        width={size}
        height={size}
        onError={() => {
          isImageErr = true;
        }}
      />
      {online && (
        <div className="absolute bottom-0 right-0 aspect-square h-3 w-3 rounded-full border-2 border-solid border-background bg-primary" />
      )}
    </span>
  );
}

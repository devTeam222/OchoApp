import Image from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import { UsersRound } from "lucide-react";

interface GroupAvatarProps {
  avatarUrl?: string | null | undefined;
  size?: number;
  className?: string;
}

export default function GroupAvatar({
  avatarUrl,
  size,
  className,
}: GroupAvatarProps) {
  if (!avatarUrl) {
    const sizePx = size ?? 48;
    return (
      <div
        className={`relative flex aspect-square h-fit min-h-fit w-fit min-w-fit items-center justify-center overflow-hidden rounded-full bg-muted`}
      >
        <Image
          src={avatarPlaceholder}
          alt=""
          className="pointer-events-none select-none opacity-0"
          width={sizePx}
          height={sizePx}
        />
        <UsersRound
          className="absolute flex items-center justify-center rounded-full fill-muted-foreground text-muted-foreground"
          size={sizePx > 32 ? sizePx - 16 : sizePx - 4}
        />
      </div>
    );
  }
  return (
    <Image
      src={avatarUrl || avatarPlaceholder}
      alt="Group avatar"
      width={size ?? 48}
      height={size ?? 48}
      className={cn(
        "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
        className,
      )}
    />
  );
}

import Image, { StaticImageData } from "next/image";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";

interface UserAvatarProps {
  avatarUrl: string | StaticImageData | null | undefined;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  size,
  className,
}: UserAvatarProps) {
  if (!avatarUrl) {
    const sizePx = size ?? 48;
    return (
      <span>
        <div
          className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-full bg-muted h-fit w-fit min-w-fit min-h-fit`}
        >
          <Image
            src={avatarPlaceholder}
            alt=""
            className="pointer-events-none select-none opacity-0"
            width={sizePx}
            height={sizePx}
          />
          <UserRound
            className="absolute rounded-full text-muted-foreground"
            size={sizePx > 32 ? sizePx - 16 : sizePx - 4}
          />
        </div>
      </span>
    );
  }
  return (
    <Image
      src={avatarUrl || avatarPlaceholder}
      alt="User avatar"
      width={size ?? 48}
      height={size ?? 48}
      className={cn(
        "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
        className,
      )}
    />
  );
}

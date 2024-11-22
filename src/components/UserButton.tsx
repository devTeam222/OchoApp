"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { Check, LogOutIcon, PaintbrushVertical, Moon, Sun, UserIcon, UserRound } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();

  useQuery({
    queryKey: ["last-seen", user.id],
    queryFn: () =>
      kyInstance
        .get("/api/users/set-last-seen"),
    refetchInterval: 60 * 1000,
    throwOnError: false,
  });

  const { theme, setTheme } = useTheme();

  const queryClient = useQueryClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn("flex-none rounded-full aspect-square", className)}
          title="Profil"
        >
          <UserAvatar avatarUrl={user.avatarUrl} size={40} online />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="max-sm:max-w-36">
          Connecté(e) en tant que @{user.username}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/users/${user.username}`}>
          <DropdownMenuItem>
            <UserRound className="mr-2 size-4 rounded-full" />
            Profil
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "system" && <PaintbrushVertical className="mr-2 size-4" />}
            {theme === "light" && <Sun className="mr-2 size-4" />}
            {theme === "dark" && <Moon className="mr-2 size-4" />}
            Thême
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="max-sm:max-w-48">
              <DropdownMenuItem
                onClick={() => {
                  setTheme("system");
                }}
              >
                <PaintbrushVertical className="mr-2 size-4" />
                Système (défaut)
                {theme === "system" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("light");
                }}
              >
                <Sun className="mr-2 size-4" />
                Clair
                {theme === "light" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("dark");
                }}
              >
                <Moon className="mr-2 size-4" />
                Sombre
                {theme === "dark" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            queryClient.clear();
            logout();
          }}
        >
          <LogOutIcon className="mr-2 size-4" />
          Deconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import UserAvatar from "@/components/UserAvatar";
import { useSession } from "../SessionProvider";
import {
  Earth,
  LockKeyholeIcon,
  LogOutIcon,
  SunMoonIcon,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { user } = useSession();
  return (
    <div className="flex w-full min-w-0 flex-col gap-5 pb-3">
      <div className="flex w-full flex-col items-center gap-5">
        <UserAvatar avatarUrl={user.avatarUrl} size={100} />
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-extrabold">{user.displayName}</h1>
          <span className="text-muted-foreground">@{user.username}</span>
        </div>
        <Link href={`/users/${user.username}`}>
        <Button variant="outline">Voir le profil</Button>
        </Link>
      </div>
      <div className="w-full">
        <ul className="flex w-full flex-col gap-2 rounded-2xl bg-card p-2 shadow-sm max-sm:rounded-none max-sm:bg-card/50">
          <li className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-lg hover:bg-accent max-sm:rounded-sm">
            <UserRound size={24} />
            <span>Compte</span>
          </li>
          <li className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-lg hover:bg-accent max-sm:rounded-sm">
            <LockKeyholeIcon size={24} />
            <span>Confidentialité et sécurité</span>
          </li>
          <li className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-lg hover:bg-accent max-sm:rounded-sm">
            <SunMoonIcon size={24} />
            <span>Affichage</span>
          </li>
          <li className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-lg hover:bg-accent max-sm:rounded-sm">
            <Earth size={24} />
            <span>Langue (language)</span>
          </li>
        </ul>
        <ul className="flex w-full flex-col gap-2 rounded-2xl py-2 shadow-sm max-sm:px-2">
          <li className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 px-4 text-lg text-destructive hover:bg-accent max-sm:rounded-sm max-sm:px-2">
            <LogOutIcon size={24} />
            <span>Déconnexion</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

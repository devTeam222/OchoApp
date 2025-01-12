"use client";

import UserAvatar from "@/components/UserAvatar";
import { useSession } from "../SessionProvider";
import OchoLink from "@/components/ui/OchoLink";
import { Button } from "@/components/ui/button";
import { Language, VocabularyKey, getVocabularyObject } from "@/lib/vocabulary";
import { t } from "@/context/LanguageContext";
import { CheckCircle2, ChevronRight } from "lucide-react";

export type SettingsOption = {
  value: string;
  label: string;
  icon: JSX.Element;
  action: "default" | "destructive";
  onClick: (value: string | Language) => void;
  active?: boolean;
  hasSubMenu?: boolean;
};

interface SettingsProps {
  setting?: string | null;
  label?: string | null;
  options: SettingsOption[];
}

export default function Settings({
  setting = null,
  label = null,
  options,
}: SettingsProps) {
  const { user } = useSession();
  const {
    viewProfile
  } = t();

  if (!user) return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 pb-3">
      <div className="flex w-full flex-col items-center gap-5">
        {setting && label ? (
            <h2 className="text-center text-2xl font-bold">{label}</h2>
    
        ) : (
          <>
            <UserAvatar avatarUrl={user.avatarUrl} size={100} />
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-extrabold">{user.displayName}</h1>
              <span className="text-muted-foreground">@{user.username}</span>
            </div>
            <OchoLink href={`/users/${user.username}`} className="text-inherit">
              <Button variant="outline">{viewProfile}</Button>
            </OchoLink>
          </>
        )}
      </div>
      <div className="w-full select-none">
        <ul className="flex w-full flex-col gap-2 rounded-2xl bg-card p-2 shadow-sm max-sm:rounded-none max-sm:bg-card/50">
          {options
            .filter(({ action }) => action === "default")
            .map(({ value, label, icon, onClick, hasSubMenu, active }) => (
              <li
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 text-lg hover:bg-accent max-sm:rounded-sm"
                onClick={() => onClick(value)}
              >
                {icon}
                <span className="flex-1">{label}</span>
                {active && (<CheckCircle2/>)}
                {hasSubMenu && (<ChevronRight size={24}/>)}
              </li>
            ))}
        </ul>
        <ul className="flex w-full flex-col gap-2 rounded-2xl py-2 shadow-sm max-sm:px-2">
          {options
            .filter(({ action }) => action === "destructive")
            .map(({ value, label, icon, onClick, active, hasSubMenu }) => (
              <li
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 px-4 text-lg text-destructive hover:bg-accent max-sm:rounded-sm max-sm:px-2"
                onClick={() => onClick(value)}
              >
                {icon}
                <span className="flex-1">{label}</span>
                {active && (<CheckCircle2/>)}
                {hasSubMenu && (<ChevronRight size={24}/>)}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

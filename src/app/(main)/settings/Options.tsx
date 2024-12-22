"use client";

import {
  UserRound,
  LockKeyholeIcon,
  SunMoonIcon,
  EarthIcon,
  LogOutIcon,
  Cake,
  AtSign,
  CarFront,
  Snowflake,
  Trash2,
  CirclePower,
  Paintbrush2,
  SunIcon,
  Moon,
} from "lucide-react";
import Settings, { SettingsOption } from "./Settings";
import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { useQueryClient } from "@tanstack/react-query";
import { late } from "zod";
import French from "@/components/flags/French";
import { useTheme } from "next-themes";
import US from "@/components/flags/US";

interface OptionsProps {
  setting?: string | null;
  subOption?: boolean;
}

export default function Options({
  setting = null,
  subOption = false,
}: OptionsProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const queryClient = useQueryClient();

  const options: SettingsOption[] = [
    {
      value: "account",
      label: "Compte",
      icon: <UserRound size={24} />,
      action: "default",
      onClick: (value) => router.push(`/settings/${value}`),
    },
    {
      value: "privacy",
      label: "Confidentialité et sécurité",
      icon: <LockKeyholeIcon size={24} />,
      action: "default",
      onClick: (value) => router.push(`/settings/${value}`),
    },
    {
      value: "display",
      label: "Affichage",
      icon: <SunMoonIcon size={24} />,
      action: "default",
      onClick: (value) => router.push(`/settings/${value}`),
    },
    {
      value: "language",
      label: "Langue (language)",
      icon: <EarthIcon size={24} />,
      action: "default",
      onClick: (value) => router.push(`/settings/${value}`),
    },
    {
      value: "logout",
      label: "Déconnexion",
      icon: <LogOutIcon size={24} />,
      action: "destructive",
      onClick: () => {
        queryClient.clear();
        logout();
      },
    },
  ];

  const subOptions: Record<string, SettingsOption[]> = {
    account: [
      {
        value: "birthday",
        label: "Date de naissance",
        icon: <Cake size={24} />,
        action: "default" as const,
        onClick: (value: string) => console.log(value),
      },
      {
        value: "password",
        label: "Mot de passe",
        icon: <LockKeyholeIcon size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
      },
      {
        value: "username",
        label: "Nom d'utilisateur",
        icon: <AtSign size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
      },
      {
        value: "export",
        label: "Exporter mes données",
        icon: <CarFront size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
      },
      {
        value: "disable",
        label: "Désactiver mon compte",
        icon: <Snowflake size={24} />,
        action: "destructive",
        onClick: (value: string) => console.log(value),
      },
      {
        value: "delete",
        label: "Supprimer mon compte",
        icon: <Trash2 size={24} />,
        action: "destructive",
        onClick: (value: string) => console.log(value),
      },
    ],
    privacy: [
      {
        value: "online",
        label: "Statut en ligne",
        icon: <CirclePower size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
      },
    ],
    display: [
      {
        value: "default",
        label: "Système",
        icon: <Paintbrush2 size={24} />,
        action: "default",
        onClick: () => setTheme("system"),
      },
      {
        value: "light",
        label: "Clair",
        icon: <SunIcon size={24} />,
        action: "default",
        onClick: (value: string) => setTheme("light"),
      },
      {
        value: "dark",
        label: "Sombre",
        icon: <Moon size={24} />,
        action: "default",
        onClick: (value: string) => setTheme("dark"),
      },
    ],
    language: [{
        value: "french",
        label: "Français",
        icon: <French size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
    },
    {
        value: "english",
        label: "English",
        icon: <US size={24} />,
        action: "default",
        onClick: (value: string) => console.log(value),
    },
  ]
  };

  // Verifier si l'option est un sous-menu si oui trouver le label dans les options et la liste des menus dans subOptions
  if (subOption && setting) {
    const option: SettingsOption[] =
      subOptions[setting as keyof typeof subOptions];
    const label = options.find((option) => option.value === setting)?.label;
    if (!option || !label) {
      router.push("/settings");
      return null;
    }
    return <Settings options={option} setting={setting} label={label} />;
  }

  return <Settings options={options} setting={setting} />;
}

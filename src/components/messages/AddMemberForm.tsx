"use client";

import { useState } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, SearchIcon } from "lucide-react";
import { ChannelData, UserData, UsersPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "../ui/input";
import UserAvatar from "../UserAvatar";
import { useAddMemberMutation } from "./mutations";
import LoadingButton from "../LoadingButton";
import { MemberType } from "@prisma/client";

interface AddMemberFormProps {
  onAdd: () => void;
  channel: ChannelData;
}

export default function AddMemberForm({ onAdd, channel }: AddMemberFormProps) {
  const [query, setQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);

  const mutation = useAddMemberMutation();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["group", "users", "search", query],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/users/search", {
            searchParams: {
              q: query || "",
              channelId: channel.id,
              ...(pageParam ? { cursor: pageParam } : {}),
            },
          })
          .json<UsersPage>(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      gcTime: 0,
    });

  const users = data?.pages?.flatMap((page) => page?.users) || [];

  const handleUserSelect = (user: UserData) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = () => {
    mutation.mutate(
      {
        channelId: channel.id,
        members: selectedUsers.map((member) => member.id),
      },
      {
        onSuccess: ({ newMembersList }) => {
          const newMembers = newMembersList
            .map((member) => ({
              user: {
                id: member.user?.id ?? "", // Fournit une valeur par défaut si null ou undefined
                username: member.user?.username ?? "",
                displayName: member.user?.displayName ?? "",
                avatarUrl: member.user?.avatarUrl ?? null,
                bio: member.user?.bio ?? null,
                createdAt: member.user?.createdAt ?? new Date(), // Fournit une valeur par défaut
              },
              userId: member.userId ?? "",
              type: "MEMBER" as MemberType, // Assurez-vous que "MEMBER" est bien une valeur valide pour MemberType
            }))
            .filter(
              (member) => !selectedUsers.some((u) => u.id === member.userId),
            );

          setSelectedUsers([]);
          setQuery("");
          channel.members = [...channel.members, ...newMembers];
          onAdd();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {!!selectedUsers.length && (
        <LoadingButton
          onClick={handleSubmit}
          loading={mutation.isPending}
          disabled={!selectedUsers.length}
          className="w-full rounded-lg"
        >
          Ajouter {!!selectedUsers.length && ` (${selectedUsers.length})`}
        </LoadingButton>
      )}
      <div>
        <form
          className="relative"
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setQuery(inputValue);
          }}
        >
          <Input
            placeholder="Rechercher des utilisateurs"
            className="rounded-3xl pe-10 ps-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <SearchIcon
            className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground hover:text-primary"
            onClick={() => setQuery(inputValue)}
          />
        </form>
      </div>

      <div className="space-y-2">
        {status === "error" && (
          <p className="my-8 w-full text-center text-destructive">
            Erreur lors de la récupération des données
          </p>
        )}
        {status === "pending" && !!query && (
          <p className="text-weak my-8 w-full text-center">
            Chargement en cours...
          </p>
        )}
        {status === "success" && !users.length && !hasNextPage && (
          <div className="flex h-full items-center">
            <p className="w-full select-none px-3 py-10 text-center italic text-muted-foreground">
              Aucun utilisateur disponible
            </p>
          </div>
        )}
        {status !== "success" && !query && (
          <div className="flex h-full items-center">
            <p className="w-full select-none px-3 py-10 text-center text-muted-foreground">
              Rechercher des utilisateurs...
            </p>
          </div>
        )}
        {status === "success" &&
          users.map((user) => {
            return (
              <div
                key={user.id}
                className={`cursor-pointer rounded-2xl p-2 ${
                  selectedUsers.some((u) => u.id === user.id)
                    ? "bg-primary/10"
                    : "bg-card shadow-sm hover:bg-primary/10"
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center space-x-2">
                  <UserAvatar avatarUrl={user.avatarUrl} size={32} />
                  <div>
                    <p>{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        {isFetchingNextPage && (
          <Loader2 className="mx-auto my-3 animate-spin" />
        )}
        {!isFetchingNextPage && hasNextPage && (
          <span
            className="cursor-pointer text-primary hover:underline"
            onClick={() => fetchNextPage()}
          >
            afficher plus
          </span>
        )}
      </div>
    </div>
  );
}

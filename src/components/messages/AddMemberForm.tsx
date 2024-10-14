"use client";

import { useState } from "react";
import kyInstance from "@/lib/ky";
import { Loader2, SearchIcon, XIcon } from "lucide-react";
import { ChannelData, UserData, UsersPage } from "@/lib/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "../ui/input";
import UserAvatar from "../UserAvatar";
import { useAddMemberMutation } from "./mutations";
import LoadingButton from "../LoadingButton";
import { MemberType } from "@prisma/client";
import UsersList from "./UsersList";

interface AddMemberFormProps {
  onAdd: () => void;
  channel: ChannelData;
}

export default function AddMemberForm({ onAdd, channel }: AddMemberFormProps) {
  const [query, setQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const queryClient = useQueryClient();

  const mutation = useAddMemberMutation();

  const addUser = (user: UserData) => {
    if (!selectedUsers.find((selected) => selected.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    } else {
      removeUser(user);
    }
  };

  const removeUser = (user: UserData) => {
    setSelectedUsers(
      selectedUsers.filter((selected) => selected.id !== user.id),
    );
  };

  const {
    data,
    fetchNextPage,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
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
    staleTime: Infinity,
  });

  const userQuery = {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  };

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
                followers: member.user?.followers || [],
                _count: {
                  followers: member.user?._count?.followers ?? 0, // Valeur par défaut si undefined
                  posts: member.user?._count?.posts ?? 0, // Valeur par défaut si undefined
                },
              },
              userId: member.userId ?? "",
              type: "MEMBER" as MemberType, // Assurez-vous que "MEMBER" est bien une valeur valide pour MemberType
              joinedAt: new Date(),
            }))
            .filter(
              (member) => !selectedUsers.some((u) => u.id === member.userId),
            );

          setSelectedUsers([]);
          setQuery("");
          const queryKey = ["chat", channel.id];

          queryClient.invalidateQueries({ queryKey });
          onAdd();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {!!selectedUsers.length && (
        <>
          <div className="animate-scale sticky top-0 flex w-full gap-2 overflow-y-auto p-3 px-4">
            {selectedUsers.map((user, index) => (
              <div
                className="flex flex-col items-center gap-1"
                key={index}
                onClick={() => removeUser(user)}
              >
                <div className="animate-scale relative">
                  <UserAvatar avatarUrl={user.avatarUrl} size={48} />
                  <div className="absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full bg-muted p-0.5 outline-2 outline-background">
                    <XIcon size={15} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.displayName.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="animate-scale sticky top-0 flex w-full gap-2 px-2">
            <LoadingButton
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!selectedUsers.length}
              className="w-full rounded-lg"
            >
              Ajouter {!!selectedUsers.length && ` (${selectedUsers.length})`}
            </LoadingButton>
          </div>
        </>
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
        <ul>
        <UsersList
          query={userQuery}
          onSelect={addUser}
          title="Utilisateurs disponibles"
          selectedUsers={selectedUsers}
        />
        </ul>
      </div>
    </div>
  );
}

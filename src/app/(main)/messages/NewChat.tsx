import { ArrowLeft, Check, Loader2, UsersRound, XIcon } from "lucide-react";
import { useSession } from "../SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { UserData, UsersPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useCreateChatChannelMutation,
  useSaveMessageMutation,
} from "@/components/messages/mutations";
import { useActiveChannel } from "@/context/ActiveChatContext";
import { useToast } from "@/components/ui/use-toast";
import LoadingButton from "@/components/LoadingButton";
import UsersList from "@/components/messages/UsersList";

const fetchUsers =
  (endpoint: string) =>
  ({ pageParam }: { pageParam: string | null }) =>
    kyInstance
      .get(endpoint, pageParam ? { searchParams: { cursor: pageParam } } : {})
      .json<UsersPage>();

interface NewChatProps {
  onClose: () => void;
  className?: string;
}

export default function NewChat({ onClose, className }: NewChatProps) {
  const { toast } = useToast();
  const { user: loggedinUser } = useSession();
  const [isGroup, setIsgroup] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);

  const mutation = useCreateChatChannelMutation();
  const saveMsgMutation = useSaveMessageMutation();
  const { setActiveChannelId } = useActiveChannel();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  const activeGroup = () => setIsgroup(true);
  const disableGroup = () => {
    setIsgroup(false);
    setName("");
    setSelectedUsers([]);
  };

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

  const useUsersQuery = (key: string, endpoint: string) =>
    useInfiniteQuery({
      queryKey: ["new-chat", key],
      queryFn: fetchUsers(endpoint),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: Infinity,
    });

  const friendsQuery = useUsersQuery("friend", "/api/users/friends");
  const followersQuery = useUsersQuery("followers", "/api/users/followers");
  const followingQuery = useUsersQuery("following", "/api/users/following");
  const suggestionsQuery = useUsersQuery(
    "suggestions",
    "/api/users/suggestions",
  );

  const isFetchingAll =
    friendsQuery.isFetching &&
    followersQuery.isFetching &&
    followingQuery.isFetching &&
    suggestionsQuery.isFetching;

  const isPending = mutation.isPending || saveMsgMutation.isPending;

  
  const handleChatStart = (user: UserData | null = null) => {
    if (isPending) {
      toast({
        description: "Patientez la fin de l'opération en cours"
      });
      return;
    }
    if (user && !isGroup) {
      const userId = user.id;
      if (loggedinUser.id === userId) {
        saveMsgMutation.mutate(
          {},
          {
            onSuccess: ({ newChannel }) => {
              setActiveChannelId(newChannel.id);
              onClose();
            },
            onError(error) {
              console.error(error);
              toast({
                variant: "destructive",
                description: "Impossible d'envoyer un message",
              });
            },
          },
        );
        return;
      }
      mutation.mutate(
        {
          name: "",
          isGroup: false,
          members: [userId],
        },
        {
          onSuccess: ({ newChannel }) => {
            setActiveChannelId(newChannel.id);
            onClose();
          },
          onError(error) {
            console.error(error);
            toast({
              variant: "destructive",
              description: "Impossible d'envoyer un message",
            });
          },
        },
      );
    }
    if (isGroup && selectedUsers.length) {
      mutation.mutate(
        {
          name,
          isGroup: true,
          members: selectedUsers.map((user) => user.id),
        },
        {
          onSuccess: ({ newChannel }) => {
            setActiveChannelId(newChannel.id);
            onClose();
          },
          onError(error) {
            console.error(error);
            toast({
              variant: "destructive",
              description: "Impossible de creer ce groupe",
            });
          },
        },
      );
    }
    if (isGroup && !selectedUsers.length) {
      toast({
        variant: "destructive",
        description:
          "Vous devez sélectionner des utilisateurs pour créer un groupe",
      });
    }
  };
  return (
    <>
      <div
        className={cn("fixed inset-0 h-full w-full", className)}
        onClick={onClose}
      ></div>
      <div
        className={cn(
          "absolute flex h-fit w-full flex-1 flex-col bg-background shadow-sm max-sm:h-full sm:inset-1 sm:max-h-[90%] sm:max-w-72 sm:rounded-2xl",
          className,
        )}
      >
        <div className="flex items-center bg-primary/10 px-2 py-4 text-xl font-bold">
          {isGroup ? (
            <div className="cursor-pointer p-2" onClick={disableGroup}>
              <ArrowLeft />
            </div>
          ) : (
            <div
              className="cursor-pointer p-2 sm:hidden"
              title="Annuler"
              onClick={onClose}
            >
              <ArrowLeft />
            </div>
          )}
          <span className="flex-1">
            {isGroup ? "Nouveau groupe" : "Nouvelle discussion"}
          </span>
          {!isGroup && (
            <div
              className="cursor-pointer max-sm:hidden"
              title="Annuler"
              onClick={onClose}
            >
              <XIcon />
            </div>
          )}
        </div>
        <div className="relative flex w-full flex-1 select-none overflow-y-auto overflow-x-hidden">
          <ul
            className={cn(
              "relative flex min-w-full translate-x-0 flex-col gap-1 transition-all",
              isGroup && "-translate-x-full",
            )}
          >
            <li
              className="cursor-pointer p-3 px-4 hover:bg-primary/5 active:bg-primary/5"
              onClick={activeGroup}
            >
              <div className="flex items-center space-x-2">
                <div className="relative flex aspect-square h-fit min-h-[35px] w-fit min-w-fit items-center justify-center overflow-hidden rounded-full bg-primary">
                  <UsersRound
                    className="absolute flex items-center justify-center rounded-full fill-primary-foreground text-primary-foreground"
                    size={20}
                  />
                </div>
                <p>Nouveau groupe</p>
              </div>
            </li>
            {isPending && (
              <li className="w-full p-3">
                <LoadingButton loading={isPending} className="w-full">
                  Patientez
                </LoadingButton>
              </li>
            )}
            <li
              className="cursor-pointer p-3 px-4 hover:bg-primary/5 active:bg-primary/5"
              onClick={() => {
                handleChatStart(loggedinUser);
              }}
            >
              <div className="flex items-center gap-2">
                <UserAvatar avatarUrl={loggedinUser.avatarUrl} size={35} />
                <div>
                  <p>{loggedinUser.displayName} (Vous)</p>
                  <p className="text-sm text-muted-foreground">
                    Envoyez-vous un message
                  </p>
                </div>
              </div>
            </li>
            {isFetchingAll && (
              <div className="mx-auto py-5">
                <Loader2 className="animate-spin" />
              </div>
            )}
            <UsersList
              query={friendsQuery}
              title="Amis"
              onSelect={handleChatStart}
            />
            <UsersList
              query={followersQuery}
              title="Followers"
              onSelect={handleChatStart}
            />
            <UsersList
              query={followingQuery}
              title="Suivis"
              onSelect={handleChatStart}
            />
            <UsersList
              query={suggestionsQuery}
              title="Suggestions"
              onSelect={handleChatStart}
            />
          </ul>
          <ul
            className={cn(
              "relative flex min-w-full flex-1 translate-x-0 flex-col gap-1 overflow-y-auto transition-all",
              isGroup && "-translate-x-full",
            )}
          >
            <li className="cursor-pointer p-3 px-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex aspect-square h-fit min-h-[35px] w-fit min-w-fit items-center justify-center overflow-hidden rounded-full bg-primary">
                  <UsersRound
                    className="absolute flex items-center justify-center rounded-full fill-primary-foreground text-primary-foreground"
                    size={20}
                  />
                </div>
                <div className="w-full flex-1 border-b-2 border-b-primary py-1">
                  <input
                    placeholder="Nom du groupe (Facultatif)"
                    className="b w-full border-none bg-transparent outline-none"
                    ref={inputRef}
                    onChange={handleNameChange}
                  />
                </div>
              </div>
            </li>
            {!!selectedUsers.length && (
              <>
                <li className="sticky top-0 flex w-full animate-scale gap-2 overflow-y-auto p-3 px-4">
                  {selectedUsers.map((user, index) => (
                    <div
                      className="flex flex-col items-center gap-1"
                      key={index}
                      onClick={() => removeUser(user)}
                    >
                      <div className="relative animate-scale">
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
                </li>
                <li className="sticky top-0 flex w-full animate-scale gap-2 px-2 max-sm:hidden">
                  <LoadingButton loading={isPending} className="flex-1">
                    Créer
                  </LoadingButton>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={disableGroup}
                  >
                    Annuler
                  </Button>
                </li>
              </>
            )}
            {isFetchingAll && (
              <div className="mx-auto py-5">
                <Loader2 className="animate-spin" />
              </div>
            )}
            <li className="flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-1">
                <UsersList
                  query={friendsQuery}
                  title="Amis"
                  isGroup
                  selectedUsers={selectedUsers}
                  onSelect={addUser}
                />
                <UsersList
                  query={followersQuery}
                  title="Followers"
                  isGroup
                  selectedUsers={selectedUsers}
                  onSelect={addUser}
                />
                <UsersList
                  query={followingQuery}
                  title="Suivis"
                  isGroup
                  selectedUsers={selectedUsers}
                  onSelect={addUser}
                />
                <UsersList
                  query={suggestionsQuery}
                  title="Suggestions"
                  isGroup
                  selectedUsers={selectedUsers}
                  onSelect={addUser}
                />
              </ul>
            </li>
            <button
              className={cn(
                "absolute bottom-7 right-7 aspect-square h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground max-sm:flex sm:hidden",
                (isPending || !selectedUsers.length) &&
                  "bg-primary-foreground text-primary",
              )}
              title="Demarrer une nouvelle discussion"
              onClick={() => handleChatStart()}
              disabled={isPending || !selectedUsers.length}
            >
              {!isPending ? <Check /> : <Loader2 className="animate-spin" />}
            </button>
          </ul>
        </div>
      </div>
    </>
  );
}

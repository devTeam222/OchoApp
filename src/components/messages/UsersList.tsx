import { UsersPage, UserData } from "@/lib/types";
import { Loader2, Check } from "lucide-react";
import UserAvatar from "../UserAvatar";
import { useToast } from "../ui/use-toast";
import { cn } from "@/lib/utils";

type UsersQuery = {
  data: { pages: UsersPage[] } | undefined;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  status: string;
};

interface UsersListProps {
  query: UsersQuery;
  title: string;
  isGroup?: boolean;
  canSelect?: boolean;
  selectedUsers?: UserData[];
  onSelect: (user: UserData) => void;
}

export default function UsersList({
  query: { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage },
  title,
  isGroup,
  selectedUsers = [],
  canSelect = true,
  onSelect,
}: UsersListProps) {
  const { toast } = useToast();
  if (!data?.pages?.length) return null;

  return (
    <>
      {!!data?.pages[0].users.length && (
        <li className="w-full px-4 text-xs font-bold text-muted-foreground">
          {title}
        </li>
      )}
      {isFetching && !isFetchingNextPage && (
        <li className="w-full py-5 flex justify-center">
          <Loader2 className="animate-spin" />
        </li>
      )}
      {data.pages.map((page, pageIndex) =>
        page.users.map((user) => (
          <li
            key={`${pageIndex}-${user.id}`}
            className={cn(
              "w-full cursor-pointer p-3 px-4 hover:bg-primary/5 active:bg-primary/5 rounded-xl",
              !canSelect && "opacity-70",
            )}
            onClick={() => {
              if (!canSelect) {
                toast({
                  description:
                    "Vous ne pouvez pas selectionner d'autres utilisateurs",
                });
              }
              onSelect(user);
            }}
          >
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="relative flex-shrink-0">
                <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                {!!selectedUsers.find(
                  (selected) => selected.id === user.id,
                ) && (
                  <div className="absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full bg-primary p-0.5 outline-2 outline-background">
                    <Check size={10} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p>{user.displayName}</p>
                {user.bio && (
                  <p className="line-clamp-2 w-full overflow-hidden text-ellipsis text-sm text-muted-foreground">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </li>
        )),
      )}
      {isFetchingNextPage && (
        <li className="w-full flex justify-center py-5">
          <Loader2 className="animate-spin" />
        </li>
      )}
      {hasNextPage && !isFetchingNextPage && (
        <li
          className="w-full flex justify-center cursor-pointer pb-2 text-primary hover:underline max-sm:underline"
          onClick={fetchNextPage}
        >
          Afficher plus
        </li>
      )}
    </>
  );
}

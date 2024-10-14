import { UsersPage, UserData } from "@/lib/types";
import { Loader2, Check } from "lucide-react";
import UserAvatar from "../UserAvatar";



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
  selectedUsers?: UserData[];
  onSelect: (user: UserData) => void;
}

export default function UsersList({
  query: { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage },
  title,
  isGroup,
  selectedUsers = [],
  onSelect,
}: UsersListProps) {
  if (!data?.pages?.length) return null;

  return (
    <>
      {!!data?.pages[0].users.length && (
        <li className="px-4 text-xs font-bold text-muted-foreground">
          {title}
        </li>
      )}
      {isFetching && !isFetchingNextPage && (
        <li className="mx-auto py-5">
          <Loader2 className="animate-spin" />
        </li>
      )}
      {data.pages.map((page, pageIndex) =>
        page.users.map((user) => (
          <li
            key={`${pageIndex}-${user.id}`}
            className="cursor-pointer p-3 px-4 hover:bg-primary/5 active:bg-primary/5"
            onClick={() => {
              onSelect(user);
            }}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <UserAvatar avatarUrl={user.avatarUrl} size={40} />
                {!!selectedUsers.find(
                  (selected) => selected.id === user.id,
                ) && (
                  <div className="absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full bg-primary p-0.5 outline-2 outline-background">
                    <Check size={10} />
                  </div>
                )}
              </div>
              <div>
                <p>{user.displayName}</p>
                {user.bio && (
                  <p className="line-clamp-2 text-ellipsis text-sm text-muted-foreground">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </li>
        )),
      )}
      {isFetchingNextPage && (
        <li className="mx-auto py-5">
          <Loader2 className="animate-spin" />
        </li>
      )}
      {hasNextPage && !isFetchingNextPage && (
        <li
          className="mx-auto cursor-pointer pb-2 text-primary hover:underline max-sm:underline"
          onClick={fetchNextPage}
        >
          Afficher plus
        </li>
      )}
    </>
  );
}

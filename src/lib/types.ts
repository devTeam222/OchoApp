import { Prisma } from "@prisma/client";


export type MenuBarContextType = {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
};

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
    followers: {
      where: {
        followerId: loggedInUserId
      },
      select: {
        followerId: true
      }
    },
    _count: {
      select: {
        posts: true,
        followers: true
      }
    }
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export function getChatChannelDataInclude() {
  return {
    members: {
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
          }
        },
        type: true,
      },
    },
    messages: {
      take: 1,
      select: getMessageDataSelect(),
      orderBy: { createdAt: 'desc' },
    },
  } satisfies Prisma.ChannelInclude;
}

export function getMessageDataSelect() {
  return {
    type: true,
    content: true,
    sender: {
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
      }
    },
    recipient: {
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
      }   
    },
    createdAt: true,
  } satisfies Prisma.MessageSelect
}

export type ChannelData = Prisma.ChannelGetPayload<{
  include: ReturnType<typeof getChatChannelDataInclude>;
}>

export interface ChannelsSection {
  channels: ChannelData[];
  nextCursor: string | null;
}

export function getMessageDataInclude() {
  return {
    sender: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      }
    },
    recipient: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      }
    }
  } satisfies Prisma.MessageInclude;
}

export type MessageData = Prisma.MessageGetPayload<{
  include: ReturnType<typeof getMessageDataInclude>;
}>

export interface MessagesSection {
  messages: MessageData[];
  nextCursor: string | null;
}

export function getPostDataIncludes(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    attachments: true,
    likes: {
      where: {
        userId: loggedInUserId
      },
      select: {
        userId: true
      }
    },
    bookmarks: {
      where: {
        userId: loggedInUserId
      },
      select: {
        userId: true
      }
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      }
    },
  } satisfies Prisma.PostInclude;
}


export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataIncludes>;
}>;

export interface UsersPage {
  users: UserData[];
  nextCursor: string | null;
}

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getCommentDataIncludes(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  } satisfies Prisma.CommentInclude;
}

export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataIncludes>;
}>;

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

export const notificationsInclude = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    }
  },
  post: {
    select: {
      content: true,
    }
  }
} satisfies Prisma.NotificationInclude;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof notificationsInclude
}>

export interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export type SaveMessageResponse = {
  newChannel?: ChannelData;
  userId: string;
  createInfo?: MessageData;
};
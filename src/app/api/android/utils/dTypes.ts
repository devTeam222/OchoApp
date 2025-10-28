// api/android/utils/dTypes.ts
import { NotificationType } from "@prisma/client";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  verified: VerifiedUser;
  createdAt?: number;
  lastSeen?: number;
  followersCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export interface VerifiedUser {
  verified: boolean;
  type: string | null;
  expiresAt: number | null;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserSession {
  user?: User; // Détails de l'utilisateur si l'inscription réussit
  session?: Session;
}

export type DeviceType = 'ANDROID' | 'IOS' | 'WEB' | 'DESKTOP' | 'UNKNOWN';

export interface SignupResponse {
  success: boolean; // Contient une erreur si l'inscription échoue
  message?: string;
  name?: string;
  data?: UserSession; // Détails de la session si applicable
}

export interface LoginResponse {
  success: boolean; // Contient une erreur si la connexion échoue
  message?: string;
  name?: string;
  data?: UserSession;
}

export interface Session {
  id: string;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  name?: string;
  data?: T;
}

export interface Attachment {
  type: string;
  url: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  createdAt: number;
  attachments: Attachment[];
  gradient?: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Comment {
  id: string;
  author: User | null;
  content: string;
  createdAt: number;
  likes: number;
  isLiked: boolean;
  isLikedByAuthor: boolean;
  isRepliedByAuthor: boolean;
  postId: string;
  postAuthorId: string;
  replies: number;
}

export interface Reply {
  id: string;
  author: User | null;
  content: string;
  createdAt: number;
  likes: number;
  isLiked: boolean;
  isLikedByAuthor: boolean;
  commentId: string | null;
  commentAuthorId: string | null;
  commentAuthor: User | null;
  firstLevelCommentId: string | null;
  firstLevelCommentAuthorId: string | null;
  postId: string;
  postAuthorId: string;
  replies: number;
}

export interface NotificationsPage {
    notifications: NotificationData[];
    cursor: string | null;
    hasMore: boolean;
}

export interface NotificationData {
    id: string;
    type: NotificationType;
    read: boolean;
    issuer: User;
    recipientId: string;
    post?: Post | null;
    postId?: string | null;
    comment?: Comment | null;
    createdAt: number;
}

export interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

export interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
}
export interface RepliesPage {
  replies: Reply[];
  nextCursor: string | null;
}
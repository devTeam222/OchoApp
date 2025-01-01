export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  verified: VerifiedUser;
  createdAt?: number;
  lastSeen?: number;
}

export interface VerifiedUser {
  verified: boolean;
  type: string | null;
  expiresAt: Date | null;
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
}

export interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

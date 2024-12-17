import { channel } from "diagnostics_channel";
import { z } from "zod";

const requiredString = z.string().trim().min(1, "Champ obligatoire");
const requiredThreeChars = requiredString.min(3, "Ce champ doit contenir au moins trois caractères")
export const singleEmojiSchema = z
  .string()
  .trim()
  .regex(
    /^[\p{Emoji}\p{Emoji_Presentation}][\u200D\p{Emoji}\p{Emoji_Presentation}]*$/u,
    "Emoji invalide",
  )
  .refine((str) => [...str].length === 1, {
    message: "Un seul emoji s'il vous plaît",
  });

export const signupSchema = z.object({
  email: requiredString.email("Adresse email invalide"),
  username: requiredThreeChars.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Nom d'utilisateur doit contenir uniquement des lettres, des chiffres, des tirets ou des tirets bas",
  ),
  password: z
    .string()
    .min(8, "Mot de passe doit contenir au moins 8 caractères"),
});

export type SignupValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const MessageSchema = z.object({
  content: z.string(),
  channelId: z.string(),
  senderId: z.string(),
});

export const createChannelSchema = z.object({
  name: z.string().optional(),
  isGroup: z.boolean(),
  recipientId: z.string().optional(),
  members: z.array(z.string()).optional(),
});

export const addMemberSchema = z.object({
  channelId: z.string(),
  members: z.array(z.string()),
});
export const addAdminSchema = z.object({
  channelId: z.string(),
  member: z.string(),
});
export const memberActionSchema = z.object({
  channelId: z.string(),
  memberId: z.string().optional(),
  deleteGroup: z.boolean().optional(),
});
export const saveMessageSchema = z.object({
  name: z.string().optional(),
  recipientId: z.string().optional(),
  members: z.array(z.string()).optional(),
});

export const createPostSchema = z.object({
  content: z.string(),
  mediaIds: z.array(z.string()).max(5, "Vous pouvez ajouter jusqu'à 5 médias"),
});

export const createMessageSchema = z.object({
  content: requiredString,
  channelId: z.string(),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "La bio ne peut pas depasser 1000 caractères."),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const updateGroupChatProfileSchema = z.object({
  id: requiredString,
  name: z.string(),
  description: z.string().max(2000, "La description ne peut pas depasser 2000 caractères."),
});

export type UpdateGroupChatProfileValues = z.infer<typeof updateGroupChatProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});

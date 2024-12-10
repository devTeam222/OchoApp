"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { UTApi } from "uploadthing/server";
import { getUserDataSelect } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";

export async function updateUserProfile(
  values: UpdateUserProfileValues & { avatarUrl?: string },
) {
  const validatedValues = updateUserProfileSchema.parse(values);

  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...validatedValues,
      avatarUrl: values.avatarUrl,
    },
    select: getUserDataSelect(user.id),
  });

  return updatedUser;
}
export async function deleteUserAvatar() {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }
  let filePath: string;
  const avatarDir = path.resolve("data/uploads/avatars");

  if (user.avatarUrl?.includes("/uploads/avatars/")) {
    // If it's an attachment
    filePath = path.join(
      avatarDir,
      user.avatarUrl.split("/uploads/avatars/")[1],
    );
  } else {
    const key = user.avatarUrl?.split(
      `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
    )[1];
    if (!key) {
      throw new Error("Fichier introuvable");
    }
    new UTApi().deleteFiles(key);
    return;
  }

  // Supprimer le fichier s'il existe
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      avatarUrl: null,
    },
    select: getUserDataSelect(user.id),
  });

  return updatedUser;
}

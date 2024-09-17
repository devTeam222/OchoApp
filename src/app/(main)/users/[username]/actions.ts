"use server"

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { updateUserProfileSchema, UpdateUserProfileValues } from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues & { avatarUrl?: string }) {

    const validatedValues = updateUserProfileSchema.parse(values)

    const { user } = await validateRequest();

    if (!user) {
        throw new Error("Action non autorisée");
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            ...validatedValues,
            avatarUrl: values.avatarUrl
        },
        select: getUserDataSelect(user.id),
    });

    return updatedUser;
}

"use server"

import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma";
import { getCommentDataIncludes, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

export async function submitComment({
    post, content
}: { post: PostData, content: string }) {
    const { user } = await validateRequest();

    if (!user) {
        throw new Error("Action non autorisée");
    }

    const { content: validatedContent } = createCommentSchema.parse({ content })

    const [newComment] = await prisma.$transaction([
        prisma.comment.create({
            data: {
                content: validatedContent,
                postId: post.id,
                userId: user.id,
            },
            include: getCommentDataIncludes(user.id),
        }),
        ...(user.id !== post.userId ? [prisma.notification.create({
            data: {
                issuerId: user.id,
                recipientId: post.userId,
                postId: post.id,
                type: "COMMENT"
            }
        })] : [])
    ])

    return newComment
}

export async function deleteComment(id: string) {
    const { user } = await validateRequest();

    if (!user) {
        throw new Error("Action non autorisée");
    }

    const comment = await prisma.comment.findUnique({
        where: { id }
    })
    if (!comment) {
        throw new Error("Commentaire non trouve");
    }
    if (comment.userId !== user.id) {
        throw new Error("Action non autorisée");
    }

    const deletedComment = await prisma.comment.delete({
        where: { id },
        include: getCommentDataIncludes(user.id)
    });

    return deletedComment
}


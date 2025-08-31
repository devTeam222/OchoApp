import prisma from "@/lib/prisma";
import { getPostDataIncludes } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
      });
    }

    const session = await prisma.session.findUnique({
      where: {
        id: sessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
      });
    }

    const input = await req.json();

    const { content, mediaIds, gradient } = createPostSchema.parse(input);

    const newPost = await prisma.post.create({
      data: {
        content,
        userId: session.user.id,
        gradient,
        attachments: {
          connect: mediaIds.map((id: string) => ({ id })),
        },
      },
      include: getPostDataIncludes(session.user.id),
    });

    return NextResponse.json({
      success: true,
      message: "Post publié avec succès.",
      data: {
        ...newPost,
        createdAt: newPost.createdAt.getTime(),
        attachments: newPost.attachments.map((attachment) => ({
          ...attachment,
          createdAt: attachment.createdAt.getTime(),
        })),
        user: {
          ...newPost.user,
          createdAt: newPost.user.createdAt.getTime(),
          lastSeen: newPost.user.lastSeen.getTime(),
          verified: newPost.user.verified.map((item) => ({
            ...item,
            expiresAt: item.expiresAt?.getTime(),
          })),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Quelque chose s'est mal passé. Veuillez réessayer.",
    });
  }
}

"use server";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { LocalUpload } from "@/lib/types";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { UTApi } from "uploadthing/server";

const uploadDir = path.resolve("data/uploads/avatars");

export async function POST(request: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    console.error("Action non autorisée");
    return NextResponse.json(
      { error: "Action non autorisée" },
      { status: 403 },
    );
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = `${uuidv4()}_${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Assurer que le répertoire de téléchargement existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Enregistrer le fichier localement
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filepath, buffer);

    // Retourner l'URL relative pour accéder au fichier
    const url = `/api/uploads/avatars/${filename}`;
    const name = filename;
    const appUrl = url;
    const size = file.size;
    const type = "image/webp";

    const oldAvatarUrl = user.avatarUrl;
    if (oldAvatarUrl) {
      const isOnLocalServer = user.avatarUrl?.startsWith(
        "/api/uploads/avatars/",
      );

      if (oldAvatarUrl && isOnLocalServer && user.avatarUrl) {
        const filePath = path.join(
          uploadDir,
          user.avatarUrl?.split("/uploads/avatars/")[1],
        );
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (oldAvatarUrl && !isOnLocalServer) {
        const key = oldAvatarUrl.split(
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        )[1];

        await new UTApi().deleteFiles(key);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: url },
    });

    return NextResponse.json<LocalUpload[]>([
      {
        url,
        name,
        appUrl,
        size,
        type,
        serverData: {
          avatarUrl: url,
        },
      },
    ]);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}

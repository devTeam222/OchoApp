import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";
import { getChatChannelDataInclude } from "@/lib/types";
import { MemberType } from "@prisma/client";

const f = createUploadthing();
const avatarDir = path.resolve("data/uploads/avatars");

export const fileRouter = {
  // Example "profile picture upload" route - these can be named whatever you want!
  avatar: f(["image"])
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldAvatarUrl = metadata.user.avatarUrl;
      if (oldAvatarUrl) {
        const isOnLocalServer = metadata.user.avatarUrl?.startsWith(
          "/api/uploads/avatars/",
        );

        if (oldAvatarUrl && isOnLocalServer && metadata.user.avatarUrl) {
          const filePath = path.join(
            avatarDir,
            metadata.user.avatarUrl?.split("/uploads/avatars/")[1],
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

      const addAppUrl = !file.url
      .split("https://")[1]
      .startsWith(process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || "");

      const newAvatarUrl = addAppUrl ?file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      ) : file.url;
  
      await prisma.user.update({
        where: { id: metadata.user.id },
        data: { avatarUrl: newAvatarUrl },
      });

      return {
        avatarUrl: newAvatarUrl,
      };
    }),
  "group-chat-avatar": f(["image"])
    .input(z.object({ channelId: z.string() }))
    .middleware(async ({ input }) => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");

      const channelId = input.channelId;

      if (!channelId) throw new UploadThingError("Données invalides");

      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: getChatChannelDataInclude(),
      });

      if (!channel) throw new UploadThingError("Groupe introuvable");

      if (!channel.isGroup)
        throw new UploadThingError(
          "Ce canal de discussion n'est pas un groupe",
        );

      const loggedMember = channel.members.find(
        (member) => member.userId === user.id,
      );

      if (!loggedMember)
        throw new UploadThingError("Vous n'êtes pas membre de ce groupe");

      const admins: MemberType[] = ["ADMIN", "OWNER"];

      if (!admins.includes(loggedMember.type))
        throw new UploadThingError(
          "Vous n'avez pas les droits pour effectuer cette action",
        );

      return { user, channel };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldAvatarUrl = metadata.channel.groupAvatarUrl;
      if (oldAvatarUrl) {
        const isOnLocalServer = metadata.user.avatarUrl?.startsWith(
          "/api/uploads/avatars/",
        );

        if (oldAvatarUrl && isOnLocalServer && metadata.user.avatarUrl) {
          const filePath = path.join(
            avatarDir,
            metadata.user.avatarUrl?.split("/uploads/avatars/")[1],
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

      const addAppUrl = !file.url
      .split("https://")[1]
      .startsWith(process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || "");

      const newAvatarUrl = addAppUrl ?file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      ) : file.url;
      await prisma.channel
        .update({
          where: { id: metadata.channel.id },
          data: { groupAvatarUrl: newAvatarUrl },
        })
        .catch((err) => {
          console.error(err);
          throw new UploadThingError(
            "Erreur lors de la mise à jour de l'avatar",
          );
        });

      return {
        avatarUrl: newAvatarUrl,
      };
    }),
  // This route takes an attached image OR video
  messageAttachment: f(["image", "video"])
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");

      return { user };
    })
    .onUploadComplete((data) => console.log("file", data)),
  // Takes exactly ONE image up to 2MB
  strictImageAttachment: f({
    image: { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");

      return { user };
    })
    .onUploadComplete((data) => console.log("file", data)),
  // Takes up to 4 2mb images and/or 1 64MB video
  attachment: f({
    image: { maxFileSize: "2MB", maxFileCount: 4 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async ({files}) => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");
      
      // Vérifier si les fichiers ont tous une taille valide et recuperer les fichiers image et video avec taille invalide et afficher en fonction du type et de la taille autoriséé
      files.map((file) => {
        
        const fileSizeMB = file.size / 1024 ** 2;
        console.log("file", fileSizeMB);
        if (file.type.startsWith("image/")) {
          if (fileSizeMB > 2) {
            throw new UploadThingError(
              `L'image ne doit pas depasser 2 Mo`,
            );
          }
        } else if (file.type.startsWith("video/")) {
          if (fileSizeMB > 64) {
            throw new UploadThingError(
              `La vidéo ne doit pas depasser 64 Mo`,
            );
          }
        }
      });
      
      
      
      return { user };
    })
    .onUploadComplete(async ({ file }) => {
      const addAppUrl = !file.url
      .split("https://")[1]
      .startsWith(process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || "");

      const url = addAppUrl ?file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      ) : file.url;
      const media = await prisma.media.create({
        data: {
          url,
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });
      return { mediaId: media.id };
    }),
  // Takes up to 4 2mb images, and the client will not resolve
  // the upload until the `onUploadComplete` resolved.
  withAwaitedServerData: f(
    { image: { maxFileSize: "2MB", maxFileCount: 4 } },
    { awaitServerData: true },
  )
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Action non autorisée");

      return { user };
    })
    .onUploadComplete((data) => {
      return { foo: "bar" as const };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;

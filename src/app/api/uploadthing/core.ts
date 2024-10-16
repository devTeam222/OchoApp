import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";


const f = createUploadthing();
const avatarDir = path.resolve("data/uploads/avatars");

export const fileRouter = {
    // Example "profile picture upload" route - these can be named whatever you want!
    avatar: f(["image"])
      .middleware(async () => {
        const { user } = await validateRequest();

        if (!user) throw new UploadThingError("Action non autorisée");

        return { user }
    })
      .onUploadComplete(async ({ metadata, file }) => {
        const oldAvatarUrl = metadata.user.avatarUrl;
        if (oldAvatarUrl) {
            
            const isOnLocalServer = metadata.user.avatarUrl?.startsWith("/api/uploads/avatars/");
    
            if (oldAvatarUrl && isOnLocalServer && metadata.user.avatarUrl) {
                const filePath = path.join(avatarDir, metadata.user.avatarUrl?.split("/uploads/avatars/")[1]);
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
                    `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
                )[1];
    
                await new UTApi().deleteFiles(key);
            }
        }

        const newAvatarUrl = file.url.replace(
            "/f/",
            `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
        )
        await prisma.user.update({
            where: { id: metadata.user.id },
            data: { avatarUrl: newAvatarUrl }
        });

        return {
            avatarUrl: newAvatarUrl
        }
    }),
    // This route takes an attached image OR video
    messageAttachment: f(["image", "video"])
      .middleware(async () => {
        const { user } = await validateRequest();

        if (!user) throw new UploadThingError("Action non autorisée");

        return { user }
    })
      .onUploadComplete((data) => console.log("file", data)),
    // Takes exactly ONE image up to 2MB
    strictImageAttachment: f({
      image: { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
    })
      .middleware(async () => {
        const { user } = await validateRequest();

        if (!user) throw new UploadThingError("Action non autorisée");

        return { user }
    })
      .onUploadComplete((data) => console.log("file", data)),
    // Takes up to 4 2mb images and/or 1 64MB video
    attachment: f({
      image: { maxFileSize: "2MB", maxFileCount: 4 },
      video: { maxFileSize: "64MB", maxFileCount: 1 },
    })
      .middleware(async () => {
        const { user } = await validateRequest();

        if (!user) throw new UploadThingError("Action non autorisée");

        return { user }
    })
      .onUploadComplete(async ({ file }) => {
        const media = await prisma.media.create({
            data: {
                url: file.url.replace(
                    "/f/",
                    `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
                ),
                type: file.type.startsWith("image") ? "IMAGE" : "VIDEO"
            }
        });
        return {mediaId: media.id}
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

        return { user }
    })
      .onUploadComplete((data) => {
        return { foo: "bar" as const };
      }),
  } satisfies FileRouter ;

export type AppFileRouter = typeof fileRouter;


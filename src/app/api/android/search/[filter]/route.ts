// api/android/search/[filter]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  ApiResponse,
  Attachment,
  Post,
  PostsPage,
  User,
  VerifiedUser,
} from "../../utils/dTypes";
import { getPostDataIncludes, UserData } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params: { filter } }: { params: { filter: string } },
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const session_token = authHeader?.split(" ")[1];

    const session = await prisma.session.findFirst({
      where: {
        id: session_token,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            lastSeen: true,
            createdAt: true,
            following: {
              select: {
                followerId: true,
              },
              take: 0,
            },
            followers: {
              select: {
                followerId: true,
              },
              take: 0,
            },
            verified: true,
            _count: true,
          },
        },
      },
    });
    const user: UserData | undefined = session?.user;

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    // 1. Récupérer les informations de l'appareil à partir des en-têtes
    const deviceId = req.headers.get("X-Device-ID");
    const deviceTypeHeader = req.headers.get("X-Device-Type");

    // 2. Vérifier la présence des en-têtes essentiels pour l'appareil
    if (!deviceId || !deviceTypeHeader) {
      return NextResponse.json({
        success: false,
        message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
        name: "missing_device_headers",
      });
    }
    const device = await prisma.device.findFirst({
      where: {
        deviceId,
      },
    });
    const isDeviceLoggedIn = device?.logged;
    console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      return NextResponse.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    // 1. Analyser l'URL pour obtenir les paramètres de requête
    const q = req.nextUrl.searchParams.get("q");

    // 2. Préparation de la requête de recherche full-text
    if (!q) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        message: "Le paramètre de requête 'q' est manquant pour la recherche.",
        name: "MissingQueryParameter",
        data: null,
      });
    }

    // Logique de création de la requête de recherche full-text (ex: "mot1 mot2" -> "mot1:* & mot2:*")
    const searchQuery = q
      .split(" ")
      .map((term) => `${term}:*`)
      .join(" & ");

    // 3. Exécution de la requête Prisma pour les posts
    // L'utilisateur 'user' est garanti d'être non-null ici
    // --- Logique de recherche unifiée par filtre ---
    switch (filter.toLowerCase()) {
      case "posts": {
        const posts = await prisma.post.findMany({
          where: {
            OR: [
              { content: { search: searchQuery } },
              { user: { displayName: { search: searchQuery } } },
              { user: { username: { search: searchQuery } } },
            ],
          },
          // Utilisation de la fonction d'inclusion réelle
          include: getPostDataIncludes(user!.id),
          orderBy: { createdAt: "desc" },
          take: pageSize + 1,
          cursor: cursor ? { id: cursor } : undefined,
        }); // Cast des résultats pour correspondre à l'interface Post

        const results = posts.map((post) => {
          const userVerifiedData = post.user.verified?.[0];

          const expiresAt = userVerifiedData?.expiresAt?.getTime() || null;
          const canExpire = !!(expiresAt || null);

          const expired =
            canExpire && expiresAt ? new Date().getTime() < expiresAt : false;

          const isVerified = !!userVerifiedData && !expired;

          const verified: VerifiedUser = {
            verified: isVerified,
            type: userVerifiedData?.type,
            expiresAt,
          };
          const attachments: Attachment[] = post.attachments;
          const author: User = {
            id: post.userId,
            username: post.user.username,
            displayName: post.user.displayName,
            avatarUrl: post.user.avatarUrl || undefined,
            bio: post.user.bio || undefined,
            verified,
            createdAt: post.user.createdAt.getTime(),
            lastSeen: post.user.lastSeen.getTime(),
          };
          const createdAt: number = post.createdAt.getTime();
          const content: string = post.content;
          const gradient: number | undefined = post.gradient || undefined;
          const id: string = post.id;
          const likes = post._count.likes;
          const comments = post._count.comments;
          const isLiked = post.likes.some((like) => like.userId === user.id);
          const isBookmarked = post.bookmarks.some(
            (bookmark) => bookmark.userId === user.id,
          );
          const finalPost: Post = {
            id,
            author,
            content,
            createdAt,
            attachments,
            gradient,
            likes,
            comments,
            isLiked,
            isBookmarked,
          };
          return finalPost;
        });

        // 4. Déterminer le prochain curseur et formater les données
        const nextCursor =
          results.length > pageSize ? results[pageSize].id : null;

        const postsPage: PostsPage = {
          posts: results.slice(0, pageSize),
          nextCursor,
        };

        // 5. Retourner la réponse au format ApiResponse
        return NextResponse.json<ApiResponse<PostsPage>>({
          success: true,
          message: `Résultats de recherche pour les posts récupérés (terme: ${q}).`,
          name: "SearchPostsSuccess",
          data: postsPage,
        });
      }
      default:
        // Si le filtre n'est pas "posts", retourner une erreur
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          message: `Filtre de recherche non supporté: ${filter}. Seul 'posts' est actuellement implémenté.`,
          name: "UnsupportedFilter",
          data: null,
        });
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Internal server error",
      name: "server-error",
      data: null,
    } as ApiResponse<null>);
  }
}

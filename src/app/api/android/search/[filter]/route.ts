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
import { $Enums, Prisma } from "@prisma/client"; // Import nécessaire pour les requêtes Raw

export async function GET(
  req: NextRequest,
  { params: { filter } }: { params: { filter: string } },
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const session_token = authHeader?.split(" ")[1];

    // ... (Logique de session et d'authentification inchangée)
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
      // ERREUR: Utilisateur non autorisé (Statut HTTP 200)
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
      // ERREUR: En-têtes manquants (Statut HTTP 200)
      return NextResponse.json({
        success: false,
        message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
        name: "missing_device_headers",
      } as ApiResponse<null>);
    }
    const device = await prisma.device.findFirst({
      where: {
        deviceId,
      },
    });
    const isDeviceLoggedIn = device?.logged;
    // console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      // ERREUR: Appareil non autorisé (Statut HTTP 200)
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
      // ERREUR: Paramètre de requête manquant (Statut HTTP 200)
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

    // --- Logique de recherche unifiée par filtre ---
    switch (filter.toLowerCase()) {
      case "posts": {
        // La recherche Full-Text est basée sur des "vectors" ou des colonnes indexées.
        // Ici, nous utilisons l'index existant sur `content` pour la recherche de posts.
        // NOTE : Les colonnes `displayName` et `username` dans `user` nécessitent
        // potentiellement des index Full-Text séparés pour être utilisés dans une
        // seule requête `queryRaw` complexe. Pour simplifier et nous concentrer
        // sur le tri par pertinence, nous allons prioriser la recherche de contenu.
        
        // La fonction `to_tsquery` de PostgreSQL est utilisée pour interpréter la requête
        // et calculer le score `ts_rank`
        const query = Prisma.sql`
          SELECT
              id,
              ts_rank(to_tsvector('french', content), to_tsquery('french', ${searchQuery})) AS rank
          FROM
              "Post"
          WHERE
              to_tsvector('french', content) @@ to_tsquery('french', ${searchQuery})
          ORDER BY
              rank DESC,
              "createdAt" DESC
          LIMIT ${pageSize + 1}
          OFFSET ${cursor ? 1 : 0} -- Si un curseur est présent, saute le premier élément (celui du curseur)
        `;

        // Si on utilise une pagination basée sur le temps ou l'ID (plus simple mais moins précis en pertinence):
        // Laissons la logique d'origine, car la pagination par offset est moins performante
        // mais plus simple à mettre en œuvre avec un simple ID de curseur.
        // Cependant, l'approche la plus correcte est la suivante :

        const rankedPosts = await prisma.$queryRaw<{id: string, rank: number}[]>(query);
        
        const postIds = rankedPosts.map(p => p.id).slice(0, pageSize); // Ne prendre que les IDs pour la page

        let posts: ({ user: { id: string; _count: { followers: number; posts: number; }; username: string; displayName: string; avatarUrl: string | null; bio: string | null; lastSeen: Date; createdAt: Date; following: { followerId: string; }[]; followers: { followerId: string; }[]; verified: { expiresAt: Date | null; type: $Enums.VerifiedType; }[]; }; _count: { likes: number; comments: number; }; likes: { userId: string; }[]; bookmarks: { userId: string; }[]; attachments: { id: string; createdAt: Date; type: $Enums.MediaType; postId: string | null; url: string; }[]; relevance: { relevanceScore: number; }[]; } & { id: string; userId: string; createdAt: Date; relevanceScore: number; content: string; gradient: number | null; })[] = [];
        let nextCursor = null;

        if (postIds.length > 0) {
            // Deuxième requête pour récupérer les données complètes des posts 
            // en utilisant les IDs triés (cela nous permet de conserver le .include)
            posts = await prisma.post.findMany({
                where: {
                    id: { in: postIds }
                },
                include: getPostDataIncludes(user!.id),
                // L'ordre est fait en mémoire pour respecter le tri du $queryRaw
            });

            // Trier les posts récupérés dans l'ordre de pertinence établi par $queryRaw
            posts.sort((a, b) => {
                const indexA = postIds.indexOf(a.id);
                const indexB = postIds.indexOf(b.id);
                return indexA - indexB;
            });

            // Calcul du nextCursor basé sur le dernier ID de la première requête Raw (si elle a plus de `pageSize` éléments)
            if (rankedPosts.length > pageSize) {
                // Si on a plus que la taille de la page, le curseur est le dernier ID récupéré
                nextCursor = rankedPosts[pageSize - 1].id;
            } else {
                nextCursor = null;
            }
        }


        // Mappage des résultats (inchangé)
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
          const attachments: Attachment[] = post.attachments.map((att: any) => ({
            type: att.type,
            url: att.url,
          }));
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
          const isLiked = post.likes.some((like) => like.userId === user!.id);
          const isBookmarked = post.bookmarks.some(
            (bookmark) => bookmark.userId === user!.id,
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
        // Le nextCursor est déjà déterminé ci-dessus (basé sur la requête raw)

        const postsPage: PostsPage = {
          posts: results, // `results` contient déjà la taille de la page
          nextCursor,
        };

        // 5. Retourner la réponse au format ApiResponse
        // SUCCÈS (Statut HTTP 200)
        return NextResponse.json<ApiResponse<PostsPage>>({
          success: true,
          message: `Résultats de recherche pour les posts récupérés (terme: ${q}).`,
          name: "SearchPostsSuccess",
          data: postsPage,
        });
      }
      default:
        // ERREUR: Filtre non supporté (Statut HTTP 200)
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          message: `Filtre de recherche non supporté: ${filter}. Seul 'posts' est actuellement implémenté.`,
          name: "UnsupportedFilter",
          data: null,
        });
    }
  } catch (error) {
    console.error("Erreur lors de la recherche par pertinence:", error);

    // ERREUR: Erreur interne du serveur (Statut HTTP 200)
    return NextResponse.json({
      success: false,
      message: "Internal server error",
      name: "server-error",
      data: null,
    } as ApiResponse<null>);
  }
}

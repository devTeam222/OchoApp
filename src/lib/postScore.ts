import prisma from "./prisma";
import { getCommentDataIncludes, PostData, UserData } from "./types";

export async function calculateRelevanceScore(
  post: PostData,
  user: UserData,
  latestPostId?: string, // Paramètre facultatif
): Promise<number> {
  const postId = post.id;
  const userId = user.id;

  // Récupération des commentaires associés au post
  const comments = await prisma.comment.findMany({
    where: {
      postId,
    },
    include: getCommentDataIncludes(userId),
  });

  const now = new Date();
  const timeFactor =
    1 / (1 + (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60)); // Pondération pour les posts récents
  const engagementScore =
    post.likes.length * 2 + comments.length * 3 + post.bookmarks.length * 1.5;
  const proximityScore = post.user.followers.some(
    (follower) => follower.followerId === user.id,
  )
    ? 5
    : 0; // Bonus si l'utilisateur suit l'auteur
  const typeFactor =
    post.attachments.length > 0 && post.content.length ? 1.5 : 1; // Bonus si le post contient des médias

  const gradientFactor =
    !post.attachments.length && post.content.length < 100 && post.gradient
      ? 1.5
      : 1; // Bonus si le post a un gradient et peu de contenu

  // Priorisation explicite pour le post le plus récent (si fourni)
  const latestPostBonus = latestPostId && post.id === latestPostId ? 100 : 0;

  return (
    engagementScore * timeFactor +
    proximityScore +
    typeFactor +
    gradientFactor +
    latestPostBonus
  );
}

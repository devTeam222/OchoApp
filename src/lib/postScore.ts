import { cache } from "react";
import prisma from "./prisma";
import { getPostDataIncludes, PostData, UserData } from "./types";

export const calculateRelevanceScore = cache(
  (
    post: PostData,
    user: UserData,
    latestPostId?: string, // Paramètre facultatif
  ): number => {
    const postId = post.id;
    const userId = user.id;
    const comments = post._count.comments;

    const now = new Date();
    const timeFactor =
      1 / (1 + (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60)); // Pondération pour les posts récents
    const engagementScore =
      post.likes.length * 2 + comments * 3 + post.bookmarks.length * 1.5;
    const proximityScore = post.user.followers.some(
      (follower) => follower.followerId === userId,
    )
      ? 5
      : 0; // Bonus si l'utilisateur suit l'auteur
    const typeFactor =
      post.attachments.length > 0 ? (post.content.length ? 1.5 : 1.25) : 1; // Bonus si le post contient des médias

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
  },
);
export const calculateAndStoreScoresForUser = cache(async (user: UserData) => {
  const userId = user.id;
  const posts = await prisma.post.findMany({
    include: getPostDataIncludes(userId),
  });

  await Promise.all(
    posts.map(async (post) => {
      const score = calculateRelevanceScore(post, user);

      const postId = post.id;

      await prisma.postUserScore.upsert({
        where: { postId_userId: { postId, userId } },
        update: { relevanceScore: score },
        create: { postId: post.id, userId, relevanceScore: score },
      });
    }),
  );
});

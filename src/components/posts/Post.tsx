"use client";

import { PostData } from "@/lib/types";
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import Time from "../Time";
import { useSession } from "@/app/(main)/SessionProvider";
import PostMoreButton from "./PostMoreButton";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";
import { Media } from "@prisma/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import { useEffect, useRef, useState } from "react";
import { Maximize2, MessageSquare, Minimize2, X } from "lucide-react";
import Comments from "../comments/Comments";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import ZoomableComponent from "../ZoomableComponent";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const { user } = useSession();

  const [showComment, setShowComment] = useState(false);
  const [targetComment, setTargetComment] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const comment = searchParams.get("comment");

  useEffect(() => {
    // On récupère le paramètre `comment` depuis les paramètres de recherche
    if (comment) {
      setShowComment(true);
    }
  }, [comment]);

  const timestamp = post.createdAt.getTime();
  const now = Date.now();
  const diffInMs = now - timestamp;

  const relative = diffInMs < Math.abs(48 * 3600 * 1000);

  const lastSeenDate = new Date(post.user.lastSeen).getTime() - 40 * 1000;

  const isUserOnline = lastSeenDate > now;

  return (
    <article className="group/post flex flex-col gap-5 bg-card/50 p-5 shadow-sm sm:rounded-2xl sm:bg-card">
      <div className="flex justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <UserTooltip user={post.user}>
            <Link
              href={`/users/${post.user.username}`}
              title={`Afficher le profil de ${post.user.displayName}`}
            >
              <UserAvatar
                avatarUrl={post.user.avatarUrl}
                online={isUserOnline}
              />
            </Link>
          </UserTooltip>
          <div>
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-medium hover:underline"
              >
                {post.user.displayName}
              </Link>
            </UserTooltip>
            <Link
              href={`/posts/${post.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              <Time
                time={post.createdAt}
                relative={relative}
                long={!relative}
              />
            </Link>
          </div>
        </div>
        {post.user.id === user.id && (
          <PostMoreButton
            post={post}
            className="opacity-0 transition-opacity group-hover/post:opacity-100 max-sm:opacity-100"
          />
        )}
      </div>
      <Linkify postId={post.id}>
        <div className="whitespace-pre-line break-words">
          <p>{post.content}</p>
        </div>
      </Linkify>
      {!!post.attachments.length && (
        <MediaPreviews attachments={post.attachments} />
      )}
      <hr className="text-muted-foreground" />
      <div className="flex justify-between gap-5">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialState={{
              likes: post._count.likes,
              isLikedByUser: post.likes.some((like) => like.userId === user.id),
            }}
          />
          <CommentButton
            comments={post._count.comments}
            onClick={() => setShowComment(!showComment)}
          />
        </div>
        <BookmarkButton
          postId={post.id}
          initialState={{
            isBookmarkedByUser: post.bookmarks.some(
              (bookmark) => bookmark.userId === user.id,
            ),
          }}
        />
      </div>
      {showComment && (
        <>
          <div
            className="fixed inset-0 z-10 sm:hidden"
            onClick={() => setShowComment(false)}
          ></div>
          <Comments post={post} onClose={() => setShowComment(false)} />
          <Button
            variant="link"
            onClick={() => setShowComment(false)}
            className="mx-auto block"
          >
            Masquer les commentaires
          </Button>
        </>
      )}
    </article>
  );
}

interface MediaPreviewsProps {
  attachments: Media[];
}

function MediaPreviews({ attachments }: MediaPreviewsProps) {
  const [showCarousel, setShowCarousel] = useState(false);
  const maxVisibleAttachments = 3;

  const handleShowMore = () => {
    setShowCarousel(true);
  };

  const [isFullscreen, setIsFullscreen] = useState<Record<number, boolean>>({});
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleFullscreen = (index: number) => {
    const element = containerRefs.current[index];
    if (element) {
      if (!document.fullscreenElement) {
        element.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFullscreenElement = document.fullscreenElement;
      const isCurrentlyFullscreen = attachments.reduce(
        (acc, _, index) => {
          acc[index] =
            containerRefs.current[index] === currentFullscreenElement;
          return acc;
        },
        {} as Record<number, boolean>,
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attachments]);

  return (
    <div>
      {/* Affichage de la grille des pièces jointes */}
      <div
        className={cn(
          "flex flex-col gap-3",
          attachments.length > 1 && "grid grid-cols-2",
        )}
      >
        {attachments.slice(0, maxVisibleAttachments).map((m) => (
          <div
            className={cn(
              "relative flex items-center overflow-hidden rounded-xl text-primary flex-shrink-0",
              attachments.length > maxVisibleAttachments && "aspect-square",
            )}
            onClick={handleShowMore}
            key={m.id}
          >
            <MediaPreview
              media={m}
              className={cn(
                "h-full w-full aspect-square",
                attachments.length > maxVisibleAttachments && "object-cover",
              )}
              hidden
            />
          </div>
        ))}
        {/* Afficher le bouton "Voir plus" si le nombre de pièces jointes dépasse la limite */}
        {attachments.length > maxVisibleAttachments && (
          <div
            onClick={handleShowMore}
            className="relative flex aspect-square items-center overflow-hidden rounded-xl border-primary text-white underline"
          >
            <MediaPreview
              media={attachments[maxVisibleAttachments]}
              className="h-full w-full object-cover"
            />
            {attachments.length > 1 + maxVisibleAttachments && (
              <div className="absolute flex h-full w-full items-center justify-center bg-black/20 text-lg">
                +{attachments.length - maxVisibleAttachments}
              </div>
            )}
          </div>
        )}
      </div>

      {
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/20",
            !showCarousel && "hidden",
          )}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <Carousel className="flex h-full w-full items-center *:w-full">
              <div
                className="fixed h-full w-full"
                onClick={() => setShowCarousel(false)}
              ></div>
              <CarouselContent className="h-full w-full">
                {attachments.map((m, i) => (
                  <CarouselItem key={m.id} className="w-full">
                    <div
                      className={cn(
                        "relative flex h-full w-full items-center justify-center",
                        !showCarousel && "pointer-events-none",
                      )}
                    >
                      <div
                        className={cn(
                          "relative w-fit overflow-hidden rounded-xl",
                          isFullscreen[i] &&
                            "fixed h-screen w-screen rounded-none",
                        )}
                        ref={(el) => {
                          containerRefs.current[i] = el;
                        }}
                      >
                        <MediaPreview
                          media={m}
                          useDefault
                          className={cn(
                            "object-contain max-sm:w-full sm:h-full sm:min-w-[500px]",
                            isFullscreen[i]
                              ? "absolute flex h-screen w-screen max-w-full items-center justify-center rounded-none"
                              : "sm:max-w-[800px]",
                          )}
                          hidden={showCarousel}
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-2">
                          <div
                            className={cn(
                              "rounded-2xl",
                              isFullscreen[i] && "p-4",
                            )}
                          >
                            <FullscreenButton
                              isFullscreen={isFullscreen[i]}
                              onFullscreen={() => {
                                toggleFullscreen(i);
                              }}
                            />
                          </div>
                          {!isFullscreen[i] && attachments.length > 1 && (
                            <div className="rounded-2xl bg-primary/70 px-3 text-primary-foreground">
                              {i + 1}/{attachments.length}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {attachments.length > 1 && (
                <div className="absolute w-full max-w-[100vw] p-3">
                  <CarouselPrevious />
                  <CarouselNext />
                </div>
              )}
            </Carousel>
          </div>
          <div
            className="fixed right-4 top-4 cursor-pointer hover:text-red-500"
            onClick={() => setShowCarousel(false)}
          >
            <X size={40} className="" />
          </div>
        </div>
      }
    </div>
  );
}

interface MediaPreviewProps {
  media: Media;
  useDefault?: boolean;
  className?: string;
  hidden?: boolean;
}

function MediaPreview({
  media,
  useDefault,
  className,
  hidden,
}: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Pause la vidéo si le composant est masqué (hidden = true)
  useEffect(() => {
    if (videoRef.current && hidden) {
      videoRef.current.pause();
    }
  }, [hidden]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (media.type === "IMAGE") {
    return (
      <ZoomableComponent
        clasName="mx-auto h-full w-full"
        zoomable={isFullscreen}
      >
        <Image
          src={media.url}
          alt="Attachment"
          width={500}
          height={500}
          className={cn(
            "h-full w-full rounded-xl bg-background object-cover shadow-sm outline outline-2 outline-muted max-sm:max-w-[500px]",
            isFullscreen
              ? "max-h-screen max-w-[100vw]"
              : "max-h-[90vh] max-w-[90vw]",
            className,
          )}
        />
      </ZoomableComponent>
    );
  }
  if (media.type === "VIDEO") {
    return (
      <ZoomableComponent
        clasName="mx-auto h-full w-full"
        zoomable={isFullscreen}
      >
        <div
          className={cn(
            "relative flex h-full w-full grid-cols-1 grid-rows-1 overflow-auto rounded-xl shadow-sm",
            isFullscreen
              ? "max-h-screen max-w-[100vw]"
              : "max-h-[90vh] max-w-[90vw]",
            className,
          )}
        >
          <video
            ref={videoRef}
            controls={useDefault}
            height={500}
            width={500}
            className={cn(
              "relative h-full w-full bg-background shadow-sm",
              hidden
                ? "object-cover"
                : "absolute bottom-0 top-0 object-contain",
              isFullscreen
                ? "max-h-screen max-w-[100vw] object-contain"
                : "max-h-[90vh] max-w-[90vw]",
            )}
          >
            <source src={media.url} />
          </video>
        </div>
      </ZoomableComponent>
    );
  }
  return <p className="text-destructive">Format media non supporté</p>;
}
interface FullscreenButtonProps {
  isFullscreen: boolean;
  onFullscreen: () => void;
}

function FullscreenButton({
  isFullscreen,
  onFullscreen,
}: FullscreenButtonProps) {
  return (
    <div
      className="cursor-pointer rounded bg-primary-foreground/80 p-1 hover:bg-primary-foreground"
      onClick={onFullscreen}
    >
      {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
    </div>
  );
}

interface CommentButtonProps {
  onClick: () => void;
  comments: number;
}
function CommentButton({ comments, onClick }: CommentButtonProps) {
  return (
    <button
      title="Commentaires"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <MessageSquare />
      {!!comments && (
        <span className="text-sm font-medium tabular-nums">
          {comments}{" "}
          <span className="hidden sm:inline">
            commentaire{comments > 1 ? "s" : ""}
          </span>
        </span>
      )}
    </button>
  );
}

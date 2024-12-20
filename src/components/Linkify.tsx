import { LinkIt, LinkItUrl } from "react-linkify-it";
import React from "react";
import Link from "next/link";
import UserLinkWithTooltip from "./UserLinkWithTooltip";
import kyInstance from "@/lib/ky";
import { cn } from "@/lib/utils";

interface LinkifyProps {
  children: React.ReactNode;
  className?: string;
  postId?: string;
}

export default function Linkify({ children, className }: LinkifyProps) {
  return (
    <LinkifyHashtag className={className}>
      <LinkifyUsername>
        <LinkifyUrl className={className}>{children}</LinkifyUrl>
      </LinkifyUsername>
    </LinkifyHashtag>
  );
}

function LinkifyUrl({ children, className }: LinkifyProps) {
  return (
    <LinkItUrl className={cn("text-primary hover:underline", className)}>{children}</LinkItUrl>
  );
}

function LinkifyUsername({ children, postId }: LinkifyProps) {
  return (
    <LinkIt
      regex={/(?<!https?:\/\/\S*)@([a-zA-Z0-9_-]+)/}
      component={(match, key) => {
        return (
          <UserLinkWithTooltip key={key} username={match.slice(1)} onFind={async user=>{
            if(user && postId){
              try {
                // Envoyer une requête pour créer une notification d'identification
                await kyInstance.post("/api/notifications/identify", {
                  json: {
                    recipientId: user.id,
                    postId: postId,
                    type: "IDENTIFY"
                  }
                });
                console.log(`Notification d'identification envoyée à ${user.username}`);
              } catch (error) {
                console.error("Erreur lors de l'envoi de la notification :", error);
              }
            }
          }}>
            {match}
          </UserLinkWithTooltip>
        );
      }}
    >
      {children}
    </LinkIt>
  );
}

function LinkifyHashtag({ children, className }: LinkifyProps) {
  return (
    <LinkIt
      regex={/(?<!https?:\/\/\S*)#([a-zA-Z0-9_-]+)/}
      component={(match, key) => {
        return (
          <Link
            key={key}
            href={`/hashtag/${match.slice(1)}`}
            className={cn("text-primary hover:underline", className)}
          >
            {match}
          </Link>
        );
      }}
    >
      {children}
    </LinkIt>
  );
}

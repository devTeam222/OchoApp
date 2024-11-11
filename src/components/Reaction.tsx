"use client";

import { SmilePlusIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import QuickReaction from "./messages/QuickReaction";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { cn } from "@/lib/utils";

interface ReactionProps {
  onReact: (emoji: string) => void;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  open?: boolean;
  size?: number;
  className?: string;
  isOwner?: boolean;
}

export default function Reaction({
  onReact,
  children,
  open = false,
  size = 24,
  className,
  isOwner = false,
  onOpenChange = () => {},
}: ReactionProps) {
  const [showReaction, setShowReaction] = useState(open);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setShowReaction(open);
  }, [open, setShowReaction]);

  const toggleReaction = () => {
    setShowPicker(false);
    setShowReaction(!showReaction);
    onOpenChange(showReaction);
  };
  const closeReaction = () => {
    setShowReaction(false);
    setShowPicker(false);
    onOpenChange(false);
  };
  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  return (
    <>
      {!showReaction && (
        <span
          onClick={toggleReaction}
          className={cn("h-fit w-fit cursor-pointer", className)}
          title="Ajouter une reaction"
        >
          {children || <SmilePlusIcon size={size} />}
        </span>
      )}
      {(showReaction || showPicker) && (
        <div
          className={cn(
            "fixed inset-0 h-full w-full bg-black/5 max-sm:left-full",
            (showReaction || showPicker) && "z-40",
          )}
          onClick={closeReaction}
        ></div>
      )}
      <div
        className={cn(
          "absolute bottom-0 z-30 flex flex-col",
          isOwner ? "right-0" : "left-0",
          (showReaction || showPicker) && "z-40",
        )}
      >
        {showPicker && (
          <div
            className={cn(
              "absolute bottom-0 h-fit w-fit bg-background max-sm:fixed max-sm:left-full max-sm:flex max-sm:w-full max-sm:justify-center max-sm:bg-transparent",
              !isOwner ? "left-0" : "right-0",
            )}
          >
            <div className="absolute flex h-full w-full items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
            <Picker
              onEmojiSelect={({ native }: { native: string }) => {
                onReact(native);
              }}
              data={data}
            />
          </div>
        )}
        {showReaction && (
          <QuickReaction
            onReact={onReact}
            onPickerOpen={togglePicker}
            className={cn("z-10", showPicker && "invisible")}
          />
        )}
      </div>
    </>
  );
}

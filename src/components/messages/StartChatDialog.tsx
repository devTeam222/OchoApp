"use client";

import { SquarePen } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "../ui/dialog";
import { ChannelData } from "@/lib/types";
import StartChatForm from "./StartChatForm";
import { useState } from "react";

interface StartChatDialogProps {
  onChatStart: (channel: ChannelData) => void;
  className?: string;
}

export default function StartChatDialog({ onChatStart, className }: StartChatDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span className={`cursor-pointer ${className}`}
          title="Demarrer une nouvelle discussion"
        >
            <SquarePen />
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Nouvelle discussion</DialogTitle>
        <StartChatForm
          onChatStart={(newChat) => {
            onChatStart(newChat);
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

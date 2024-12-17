"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "../ui/dialog";
import { ChannelData } from "@/lib/types";
import { useState } from "react";
import AddMemberForm from "./AddMemberForm";
import { cn } from "@/lib/utils";

interface AddMemberDialogProps {
  channel: ChannelData;
  className?: string;
  children: React.ReactNode;
}

export default function AddMemberDialog({
  channel,
  className,
  children,
}: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        asChild
        className={cn("cursor-pointer", className)}
        title="Ajouter un membre"
      >
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
        </DialogHeader>
        <AddMemberForm onAdd={() => setIsOpen(false)} channel={channel} />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { ChannelData, UserData } from "@/lib/types";
import { useState } from "react";
import AddMemberForm from "./AddMemberForm";

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
      <DialogTrigger asChild>
        <span
          className={`cursor-pointer ${className}`}
          title="Ajouter un membre"
        >
          {children}
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Ajouter un membre</DialogTitle>
        <AddMemberForm
          onAdd={() => setIsOpen(false)}
          channel={channel}
        />
      </DialogContent>
    </Dialog>
  );
}

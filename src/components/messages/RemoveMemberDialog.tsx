import { ChannelData } from "@/lib/types";
import { MemberType } from "@prisma/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { useRemoveMemberMutation } from "./mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import LoadingButton from "../LoadingButton";

interface RemoveMemberDialogProps {
  memberId: string;
  channel: ChannelData;
}

export default function RemoveMemberDialog({
  memberId,
  channel,
}: RemoveMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { toast } = useToast();

  function onClose() {
    setIsOpen(false);
  }

  const mutation = useRemoveMemberMutation();
  const channelId = channel.id;

  const member = channel.members.find((member) => member.userId === memberId);

  function handleSubmit() {
    mutation.mutate(
      {
        channelId,
        memberId,
      },
      {
        onSuccess: () => {
          const queryKey = ["chat", channelId];

          queryClient.invalidateQueries({ queryKey });

          toast({
            description: `Vous avez retiré ${member?.user?.displayName || "un utilisateur"} de ${channel.name || "ce groupe"}`,
          });
          onClose();
        },
        onError(error) {
          console.error(error);
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex w-full justify-center gap-3">
          <LogOut size={24} /> Retirer du groupe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Supprimer un membre</DialogTitle>
        <p>
          Vous êtes sur le point de supprimer{" "}
          {member?.user?.displayName || "un utilisateur"} de{" "}
          {channel.name || "ce groupe"}
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <LoadingButton
            loading={mutation.isPending}
            variant="destructive"
            onClick={handleSubmit}
          >
            Supprimer
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

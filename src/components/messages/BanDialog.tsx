import { ChannelData } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "../ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CircleX } from "lucide-react";
import LoadingButton from "../LoadingButton";
import { useBanMemberMutation } from "./mutations";

interface BanDialogProps {
  memberId: string;
  channel: ChannelData;
}

export default function BanDialog({ memberId, channel }: BanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function onClose() {
    setIsOpen(false);
  }

  const mutation = useBanMemberMutation();
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
            description: `Vous avez suspendu ${member?.user?.displayName || "un utilisateur"} de ${channel.name || "ce groupe"}`,
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
        <Button
          variant="destructive"
          className="flex w-full justify-center gap-3"
        >
          <CircleX size={24} /> Suspendre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Suspendre du groupe</DialogTitle>
        <p>
          Vous êtes sur le point de suspendre{" "}
          {member?.user?.displayName || "un utilisateur"} de{" "}
          {channel.name || "ce groupe"}
        </p>
        <p>Les autres administrateurs peuvent reintegrer le membre</p>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <LoadingButton
            loading={mutation.isPending}
            variant="destructive"
            onClick={handleSubmit}
          >
            Suspendre
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

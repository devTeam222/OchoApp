import { ChannelData } from "@/lib/types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";
import { useLeaveGroupMutation } from "./mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import LoadingButton from "../LoadingButton";
import { useSession } from "@/app/(main)/SessionProvider";

interface LeaveGroupDialogProps {
  channel: ChannelData;
}

export default function LeaveGroupDialog({ channel }: LeaveGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState(false);
  const { user: loggedUser } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const memberId = loggedUser.id;

  const mutation = useLeaveGroupMutation();
  const channelId = channel.id;

  const member = channel.members.find((member) => member.userId === memberId);

  function onClose() {
    setIsOpen(false);
  }

  function handleSubmit() {
    mutation.mutate(
      { channelId, deleteGroup },
      {
        onSuccess: () => {
          const queryKey = ["chat", channelId];

          queryClient.invalidateQueries({ queryKey });

          toast({
            description: `Vous avez quitté ${channel.name || "ce groupe"}`,
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
        <div className="flex items-center space-x-2">
          <div
            className={`relative flex aspect-square h-fit min-h-[35px] w-fit min-w-fit items-center justify-center overflow-hidden rounded-full bg-destructive`}
          >
            <LogOutIcon
              className="absolute flex items-center justify-center text-white"
              size={35 - 16}
            />
          </div>
          <p>Quitter le groupe</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Quitter le groupe</DialogTitle>
        <p>Êtes-vous sûr de vouloir quitter {channel.name || "ce groupe"} ?</p>
        {member?.type === "OWNER" && (
          <p>
            Si vous quittez sans supprimer le groupe le membre le plus ancien
            recevra vos privileges
          </p>
        )}
        <DialogFooter className="p-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <LoadingButton
            loading={mutation.isPending}
            variant="destructive"
            onClick={handleSubmit}
          >
            Quitter
          </LoadingButton>
          {(member?.type === "OWNER") && (
            <LoadingButton
              loading={mutation.isPending}
              variant="destructive"
              onClick={() => {
                setDeleteGroup(true);
                handleSubmit();
              }}
            >
              Quitter et supprimer le groupe
            </LoadingButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

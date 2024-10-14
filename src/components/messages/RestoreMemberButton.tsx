import { ChannelData } from "@/lib/types";
import LoadingButton from "../LoadingButton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useRestoreMemberMutation } from "./mutations";

interface RestoreMemberButtonProps {
  memberId: string;
  channel: ChannelData;
  children: React.ReactNode;
}

export default function RestoreMemberButton({
  memberId,
  channel,
  children,
}: RestoreMemberButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useRestoreMemberMutation();
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
            description: `Vous avez reintegré ${member?.user?.displayName || "un utilisateur"} à ${channel.name || "ce groupe"}`,
          });
        },
        onError(error) {
          console.error(error);
        },
      },
    );
  }
  return (
    <LoadingButton
      loading={mutation.isPending}
      className="flex w-full justify-center gap-3"
      onClick={handleSubmit}
    >
      {children}
    </LoadingButton>
  );
}

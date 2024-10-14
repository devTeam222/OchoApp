import { useSession } from "@/app/(main)/SessionProvider";
import {
  useCreateChatChannelMutation,
  useSaveMessageMutation,
} from "./mutations";
import LoadingButton from "../LoadingButton";
import { Send } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { useActiveChannel } from "@/context/ActiveChatContext";
import { useRouter } from "next/navigation";  // Importation de useRouter
import { ButtonProps } from "../ui/button";
import { cn } from "@/lib/utils";

interface MessageButtonProps extends ButtonProps {
  userId: string;
}

export default function MessageButton({ userId, className, ...props }: MessageButtonProps) {
  const mutation = useCreateChatChannelMutation();
  const saveMsgMutation = useSaveMessageMutation();
  const { setActiveChannelId } = useActiveChannel();
  const { user: loggedinUser } = useSession();
  const { toast } = useToast();
  const router = useRouter();  // Utilisation de useRouter

  const handleSubmit = () => {
    if (loggedinUser.id === userId) {
      saveMsgMutation.mutate(
        {},
        {
          onSuccess: ({ newChannel }) => {
            setActiveChannelId(newChannel.id);
            router.push("/messages");  // Utilisation de router.push au lieu de redirect
          },
          onError(error) {
            console.error(error);
            toast({
              variant: "destructive",
              description: "Impossible d'envoyer un message",
            });
          },
        },
      );
      return;
    }
    mutation.mutate(
      {
        name: "",
        isGroup: false,
        members: [userId],
      },
      {
        onSuccess: ({ newChannel }) => {
          setActiveChannelId(newChannel.id);
          router.push("/messages"); 
        },
        onError(error) {
            console.error(error);
            toast({
                variant: "destructive",
                description: "Impossible d'envoyer un message",
            })
        },
      },
    );
  };

  return (
    <LoadingButton
      loading={saveMsgMutation.isPending || mutation.isPending}
      className={cn("bg-primary", className)}
      onClick={handleSubmit}
    >
      <Send size={24} /> Message
    </LoadingButton>
  );
}

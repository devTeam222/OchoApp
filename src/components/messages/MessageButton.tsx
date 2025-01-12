import { useSession } from "@/app/(main)/SessionProvider";
import {
  useCreateChatChannelMutation,
  useSaveMessageMutation,
} from "./mutations";
import LoadingButton from "../LoadingButton";
import { Send } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { useActiveChannel } from "@/context/ChatContext";
import { useRouter } from "next/navigation"; // Importation de useRouter
import { ButtonProps } from "../ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/context/LanguageContext";
import { useProgress } from "@/context/ProgressContext";

interface MessageButtonProps extends ButtonProps {
  userId: string;
}

export default function MessageButton({
  userId,
  className,
  ...props
}: MessageButtonProps) {
  const mutation = useCreateChatChannelMutation();
  const saveMsgMutation = useSaveMessageMutation();
  const { setActiveChannelId } = useActiveChannel();
  const { user: loggedinUser } = useSession();
  const { toast } = useToast();
  const { unableToSendMessage, message } = t();
  const { startNavigation: navigate } = useProgress(); // Utilisation de useRouter

  const handleSubmit = () => {
    if (loggedinUser.id === userId) {
      saveMsgMutation.mutate(
        {},
        {
          onSuccess: ({ newChannel }) => {
            setActiveChannelId(newChannel.id);
            navigate("/messages"); // Utilisation de router.push au lieu de redirect
          },
          onError(error) {
            console.error(error);
            toast({
              variant: "destructive",
              description: unableToSendMessage,
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
          navigate("/messages");
        },
        onError(error) {
          console.error(error);
          toast({
            variant: "destructive",
            description: unableToSendMessage,
          });
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
      {!(saveMsgMutation.isPending || mutation.isPending) && <Send size={24} />}{" "}
      {message}
    </LoadingButton>
  );
}

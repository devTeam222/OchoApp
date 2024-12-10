import { MessageData } from "@/lib/types";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Copy, MoreHorizontal, Smile, Trash2 } from "lucide-react";
import DeleteMessageDialog from "./DeleteMessageDialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/(main)/SessionProvider";
import { useToast } from "../ui/use-toast";

interface MessageMoreButtonProps {
  message: MessageData;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean)=>void;
  onReactOpen?: ()=>void; 
  canReact: boolean;
}

export default function MessageMoreButton({
  message,
  className,
  open = false,
  onReactOpen,
  onOpenChange,
  canReact,
}: MessageMoreButtonProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const {user: loggedinUser} = useSession();
    const {toast} = useToast();

    if (!loggedinUser) {
        return null;
    }

    const isOwner = loggedinUser.id === message.senderId;

     // Fonction pour copier le contenu du message dans le presse-papiers
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        description: "Message copié dans le presse-papiers !"
      })
    } catch (error) {
      console.error("Erreur lors de la copie dans le presse-papiers:", error);
      toast({
        variant: "destructive",
        description: "Erreur lors de la copie dans le presse-papiers !"
      });
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={cn("rounded-full w-8 h-8",className)}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {canReact && <DropdownMenuItem onClick={onReactOpen}>
            <span className="flex items-center gap-3">
              <Smile className="size-4" />
              Reagir
            </span>
          </DropdownMenuItem>}
          <DropdownMenuItem onClick={copyToClipboard}>
            <span className="flex items-center gap-3">
              <Copy className="size-4" />
              Copier
            </span>
          </DropdownMenuItem>

          {isOwner && <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <span className="flex items-center gap-3 text-destructive">
              <Trash2 className="size-4" />
              Supprimer
            </span>
          </DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteMessageDialog
        message={message}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
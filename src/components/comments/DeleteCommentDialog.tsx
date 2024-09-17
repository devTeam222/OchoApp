import { CommentData } from "@/lib/types";
import { useDeleteCommentMutation } from "./mutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";

interface DeleteCommentDialogProps {
  comment: CommentData;
  open: boolean;
  onClose: () => void;
}

export default function DeleteCommentDialog({
  comment,
  open,
  onClose,
}: DeleteCommentDialogProps) {
  const mutation = useDeleteCommentMutation();

  function handleOpenChange(open: boolean) {
    if (!open || !mutation.isPending) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ?</DialogTitle>
          <DialogDescription>
            Voulez-vous vraiment supprimer ce commentaire ? Cette action est
            irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-center items-center">
            <LoadingButton
            variant="destructive"
            onClick={()=>mutation.mutate(comment.id, {onSuccess: onClose})}
            loading={mutation.isPending}
            >Supprimer</LoadingButton>
            <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={mutation.isPending}
            >Annuler</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ChannelData } from "@/lib/types";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import LoadingButton from "../LoadingButton";
import Resizer from "react-image-file-resizer";
import {
  updateGroupChatProfileSchema,
  UpdateGroupChatProfileValues,
} from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useDeleteGroupChatAvatarMutation,
  useUpdateGroupChatMutation,
} from "@/app/(main)/users/[username]/mutations";
import { StaticImageData } from "next/image";
import GroupAvatar from "../GroupAvatar";
import { Camera, Trash2 } from "lucide-react";
import CropImageDialog from "../CropImageDialog";
import { useToast } from "../ui/use-toast";

interface GroupChatSettingsDialogProps {
  channel: ChannelData;
  className?: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GroupChatSettingsDialog({
  channel,
  className,
  children,
  open = false,
  onOpenChange,
}: GroupChatSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const {toast} = useToast();

  const mutation = useUpdateGroupChatMutation({channelId: channel.id});

  const form = useForm<UpdateGroupChatProfileValues>({
    resolver: zodResolver(updateGroupChatProfileSchema),
    defaultValues: {
      id: channel.id,
      name: channel?.name || undefined,
      description: channel.description || "",
    },
  });

  async function onSubmit(values: UpdateGroupChatProfileValues) {
    console.log(values);

    const newAvatarFile = croppedAvatar
      ? new File([croppedAvatar], `avatar_${channel.id}.webp`)
      : undefined;

    mutation.mutate(
      {
        values,
        avatar: newAvatarFile,
      },
      {
        onSuccess: () => {
          setCroppedAvatar(null);
          onOpenChange(false);
        },
        onError(error, variables, context) {
            toast({
                variant: "destructive",
                description: "Quelque chose s'est mal passé"
            })
        },
      },
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        asChild
        className={cn("cursor-pointer", className)}
        title="Modifier les parametres du groupe"
      >
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les parametres du groupe</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-1.5">
          <Label>Icône de groupe</Label>
          <AvatarInput
            channelId={channel.id}
            src={
              croppedAvatar
                ? URL.createObjectURL(croppedAvatar)
                : channel.groupAvatarUrl
            }
            onImageCropped={setCroppedAvatar}
          />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du groupe</FormLabel>
                  <FormControl>
                    <Input placeholder="Changer le nom du groupe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Decrivez ce groupe..."
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Enregistrer
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface AvatarInputProps {
  channelId: string;
  src: string | StaticImageData | null;
  onImageCropped: (blob: Blob | null) => void;
}

function AvatarInput({ channelId, src, onImageCropped }: AvatarInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();

  const mutation = useDeleteGroupChatAvatarMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function onImageSelected(image: File | undefined) {
    if (!image) return;

    Resizer.imageFileResizer(
      image,
      1024,
      1024,
      "WEBP",
      100,
      0,
      (uri) => setImageToCrop(uri as File),
      "file",
    );
  }

  function deleteAvatar() {
    mutation.mutate({ channelId });
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
        title="Avatar"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block"
        title="Cliquez pour selectioner une image"
      >
        <GroupAvatar avatarUrl={src} size={150} className="flex-none" />
        <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-black bg-opacity-30 text-white transition-colors duration-200 group-hover:bg-opacity-25">
          <Camera size={24} />
        </span>
      </button>
      {!!src && !src?.toString().startsWith("blob:") && (
        <LoadingButton
          variant="destructive"
          loading={mutation.isPending}
          onClick={deleteAvatar}
        >
          <Trash2 size={20} /> Supprimer la photo
        </LoadingButton>
      )}
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={1}
          onCropped={onImageCropped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </>
  );
}

// components/posts/editors/PostEditor.tsx
"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PlaceHolder from "@tiptap/extension-placeholder";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/app/(main)/SessionProvider";
import "./styles.css";
import { useSubmitPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";
import useMediaUpload, { Attachment } from "./useMediaUpload";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "@uploadthing/react";

export default function PostEditor() {
  const [clear, setClear] = useState(false);
  const { user } = useSession();
  const mutation = useSubmitPostMutation();
  const {
    startUpload,
    attachments,
    isUploading,
    removeAttachment,
    reset: resetMediaUpload,
  } = useMediaUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: startUpload,
  });

  const { onClick, ...rootProps } = getRootProps();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      PlaceHolder.configure({
        placeholder: "Quoi de neuf ?",
      }),
    ],
  });

  const input = editor?.getText({ blockSeparator: "\n" }) || "";

  function onSubmit() {
    mutation.mutate(
      {
        content: input,
        mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[],
      },
      {
        onSuccess: () => {
          editor?.commands.clearContent();
          resetMediaUpload();
          setClear(true);
          setTimeout(() => setClear(false), 100);
        },
      },
    );
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  return (
    <div className="flex flex-col gap-5 bg-card/50 p-5 shadow-sm max-sm:border-t-8 max-sm:border-solid max-sm:border-background sm:rounded-2xl sm:bg-card">
      <div
        className={cn(
          "flex gap-2 rounded-3xl items-end border border-input bg-background p-1 transition-all duration-75",
          isDragActive
            ? "outline-dashed outline-primary"
            : "items-endring-primary ring-offset-background has-[.ProseMirror-focused]:outline-none has-[.ProseMirror-focused]:ring-2 has-[.ProseMirror-focused]:ring-ring has-[.ProseMirror-focused]:ring-offset-2",
        )}
      >
        <UserAvatar avatarUrl={user.avatarUrl} size={40} />
        <div {...rootProps} className="w-full">
          <EditorContent
            editor={editor}
            className="max-h-[20rem] min-h-10 w-full overflow-y-auto rounded-2xl bg-transparent py-2"
            onPaste={onPaste}
          />
          <input {...getInputProps()} />
        </div>
      </div>
      {!!attachments.length && (
        <AttachmentPreviews
          attachments={attachments}
          removeAttachment={removeAttachment}
        />
      )}
      <div className="flex items-center justify-end gap-3">
        {isUploading && (
          <Loader2 className="size-5 animate-spin text-primary" />
        )}
        <AddAttachmentButton
          onFilesSelected={startUpload}
          disabled={isUploading || attachments.length >= 5}
          clear={clear}
        />
        <LoadingButton
          onClick={onSubmit}
          loading={mutation.isPending}
          disabled={(!input.trim() && !attachments.length) || isUploading}
          className="min-w-20"
        >
          Poster
        </LoadingButton>
      </div>
    </div>
  );
}

interface AddAttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
  clear: boolean;
}

function AddAttachmentButton({
  onFilesSelected,
  disabled,
  clear,
}: AddAttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Clear the input on clear change
  useEffect(() => {
    if (clear) {
      fileInputRef.current!.value = "";
    }
  }, [clear]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary hover:text-primary"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon size={20} />
      </Button>
      <input
        type="file"
        accept="image/*, video/*"
        ref={fileInputRef}
        className="sr-only hidden"
        title="attachments input"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) {
            onFilesSelected(files);
            e.target.value = "";
          }
        }}
        maxLength={5}
      />
    </>
  );
}

interface AttachmentPreviewsProps {
  attachments: Attachment[];
  removeAttachment: (filename: string) => void;
}

function AttachmentPreviews({
  attachments,
  removeAttachment,
}: AttachmentPreviewsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        attachments.length > 1 && "grid grid-cols-2",
      )}
    >
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.file.name}
          attachment={attachment}
          onRemoveClick={() => removeAttachment(attachment.file.name)}
        />
      ))}
    </div>
  );
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemoveClick: () => void;
}

function AttachmentPreview({
  attachment: { file, mediaId, isUploading, progress },
  onRemoveClick,
}: AttachmentPreviewProps) {
  const src = URL.createObjectURL(file);

  return (
    <div className={cn("relative mx-auto size-fit overflow-hidden")}>
      {file.type.startsWith("image") ? (
        <Image
          src={src}
          alt="Attachment Preview"
          width={500}
          height={500}
          className="size-fit max-h-[30rem] rounded-2xl"
        />
      ) : (
        <video muted autoPlay className="size-fit max-h-[30rem] rounded-2xl">
          <source src={src} type={file.type} />
        </video>
      )}
      {!isUploading && (
        <button
          onClick={onRemoveClick}
          title="Retirer la pièce jointe"
          className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60"
        >
          <XIcon size={20} />
        </button>
      )}
      {!!(isUploading && progress) && (
        <div className="absolute inset-0 h-full w-full select-none">
          <div
            className={`absolute left-0 top-0 flex h-full w-full items-center rounded bg-background/80 px-2 py-1 text-center text-xl`}
          ></div>
          <div className="absolute left-[50%] top-0 z-10 flex h-full w-full translate-x-[-50%] items-center justify-center rounded text-center text-[2rem] font-bold text-foreground">
            {progress}%
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 p-1">
        <p className="h-fit w-fit max-w-full select-none overflow-hidden text-ellipsis text-nowrap rounded-sm bg-muted/40 px-2 italic text-muted-foreground">
          {file.name}
        </p>
      </div>
    </div>
  );
}

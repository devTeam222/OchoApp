import { Button } from "@/components/ui/button";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PlaceHolder from "@tiptap/extension-placeholder";
import { Loader2, Send } from "lucide-react";
import { useSubmitMessageMutation } from "@/components/messages/mutations";
import "./style.css";
import { useEffect, useState } from "react";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

interface MessageFormProps {
  channelId: string;
}

export default function MessageForm({ channelId }: MessageFormProps) {
  const [isEditorReady, setEditorReady] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useSubmitMessageMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      PlaceHolder.configure({
        placeholder: "Écrivez un message...",
      }),
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      setEditorReady(true);
    }
  }, [editor]);

  const input = editor?.getText({ blockSeparator: "\n" }) || "";

  function onSubmit() {
    mutation.mutate(
      {
        content: input,
        channelId,
      },
      {
        onSuccess: () => {
          editor?.commands.clearContent();
          const queryKey = ["chat-channels"];

          queryClient.invalidateQueries({ queryKey });
        },
      },
    );
  }

  return (
    <div className="flex gap-1 p-3">
      {isEditorReady ? (
        <>
          <EditorContent
            editor={editor}
            className="max-h-[10rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3"
          />
          <Button
            variant="ghost"
            size="icon"
            disabled={mutation.isPending}
            onClick={onSubmit}
            className="p-2"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
    </div>
  );
}

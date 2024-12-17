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
        <div className="relative w-full rounded-3xl bg-background flex p-1 items-end gap-1">
          <EditorContent
            editor={editor}
            className="max-h-[10rem] w-full overflow-y-auto rounded-3xl bg-none px-4 py-2 pr-0.5 flex-1"
          />
          <Button
            size="icon"
            disabled={mutation.isPending || !input.trim()}
            onClick={onSubmit}
            className="p-2 rounded-full"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
    </div>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/context/LanguageContext";

interface MessageFormProps {
  channelId: string;
}

export default function MessageForm({ channelId }: MessageFormProps) {
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const mutation = useSubmitMessageMutation();

  const {typeMessage} = t()

  function onSubmit() {
    mutation.mutate(
      {
        content: input,
        channelId,
      },
      {
        onSuccess: () => {
          setInput("")
          const queryKey = ["chat-channels"];

          queryClient.invalidateQueries({ queryKey });
        },
      },
    );
  }

  return (
    <div className="flex gap-1 p-3">
      
        <div className="relative flex w-full items-end gap-1 rounded-3xl border border-input bg-background p-1 ring-primary ring-offset-background transition-all duration-75 has-[textarea:focus-visible]:outline-none has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring has-[textarea:focus-visible]:ring-offset-2">
          <Textarea
            placeholder={typeMessage}
            className="max-h-[10rem] min-h-10 w-full overflow-y-auto rounded-none border-none bg-transparent px-4 py-2 pr-0.5 ring-offset-transparent focus-visible:ring-transparent"
            rows={1}
            value={input}
            onChange={({ target: { value } }) => setInput(value)}
          />
          <Button
            size="icon"
            disabled={mutation.isPending || !input.trim()}
            onClick={onSubmit}
            className="rounded-full p-2"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>
      
    </div>
  );
}

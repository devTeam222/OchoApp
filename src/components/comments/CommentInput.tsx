import { PostData } from "@/lib/types";
import { useState } from "react";
import { useSubmitCommentMutation } from "./mutations";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, SendIcon } from "lucide-react";

interface CommentInput {
  post: PostData;
}

export default function CommentInput({ post }: CommentInput) {
  const [input, setInput] = useState("");

  const mutation = useSubmitCommentMutation(post.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input) return;

    mutation.mutate(
      {
        post,
        content: input,
      },
      {
        onSuccess: () => setInput(""),
      },
    );
  }

  return (
    <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
      <Input
        placeholder="Commenter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus={!post._count.comments}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className=""
        disabled={!input.trim() || mutation.isPending}
      >
        {mutation.isPending ? (
            <Loader2 className="animate-spin"/>
        ) : (
            <SendIcon />
        )}
      </Button>
    </form>
  );
}

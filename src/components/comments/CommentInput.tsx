import { PostData } from "@/lib/types";
import { useState } from "react";
import { useSubmitCommentMutation } from "./mutations";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface CommentInput {
  post: PostData;
}

export default function CommentInput({ post }: CommentInput) {
  const [input, setInput] = useState("");

  const router = useRouter();

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
        onSuccess: (newComment) => {
          setInput("");
          router.push(`/posts/${post.id}?comment=${newComment.id}`);
        },
      },
    );
  }

  return (
    <form className="flex w-full items-center gap-2 p-2 max-sm:outline max-sm:outline-muted" onSubmit={onSubmit}>
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
          <Loader2 className="animate-spin" />
        ) : (
          <SendIcon />
        )}
      </Button>
    </form>
  );
}

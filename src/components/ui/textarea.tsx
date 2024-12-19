import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ minHeight = 40, className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = textarea.scrollHeight; // Calcule la nouvelle hauteur
        textarea.style.height = `${newHeight}px`;
      }
      if (props.onChange) {
        props.onChange(e); // Appelle le gestionnaire onChange fourni par l'utilisateur
      }
    };

    return (
      <textarea
        className={cn(
          "flex w-full overflow-hidden overflow-y-auto rounded-sm border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          `min-h-[${minHeight}px]`,
          className,
        )}
        ref={(node) => {
          textareaRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onInput={handleInput}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };

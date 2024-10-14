"use client";

import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function SearchField() {
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); // Reference for the input element
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();
    if (!q) return;
    router.push(`search?q=${encodeURIComponent(q)}`);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value); // Update the input state with the current value
  }

  function activeSearch() {
    setIsActive(true);
    inputRef.current?.focus(); // Focus the input when activating
  }

  function hideSearch() {
    if (!input.length) {
      setIsActive(false);
      inputRef.current?.blur(); // Blur the input when hiding and empty
    }
  }

  function clearSearch() {
    setInput("");
    hideSearch();
  }

  return (
    <form onSubmit={handleSubmit} method="GET" action="/search">
      <div className={cn("relative h-10")}>
        <Input
          ref={inputRef} // Attach the ref to the input
          name="q"
          placeholder="Rechercher"
          className={cn(
            "pe-16 transition-all max-w-full",
            isActive
              ? "max-sm:w-52"
              : "max-sm:w-0 max-sm:absolute max-sm:opacity-0 max-sm:pointer-events-none"
          )}
          value={input}
          onChange={handleInputChange}
          onFocus={activeSearch}
          onBlur={hideSearch}
        />
        {!!input.length && isActive && (
          <XIcon
            onClick={clearSearch}
            className="cursor-pointer absolute text-muted-foreground top-1/2 -translate-y-1/2 right-10"
          />
        )}
        <SearchIcon
          size={40}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 size-5 transform text-muted-foreground sm:right-3",
            isActive && "right-3"
          )}
          onClick={activeSearch}
        />
      </div>
    </form>
  );
}

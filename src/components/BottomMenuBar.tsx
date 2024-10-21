"use client";

import MenuBar from "@/app/(main)/MenuBar";
import { useMenuBar } from "@/context/MenuBarContext";
import { cn } from "@/lib/utils";

export default function BottomMenuBar() {
  const { isVisible } = useMenuBar();

  return (
    <MenuBar
      className={cn(
        `sticky bottom-0 flex w-full min-h-fit max-w-full justify-center gap-0 border-t bg-card transition-all overflow-x-hidden sm:hidden`,
        !isVisible && "fixed bottom-[-100%]",
      )}
    />
  );
}

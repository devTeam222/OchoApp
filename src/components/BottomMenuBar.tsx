"use client";

import MenuBar from "@/app/(main)/MenuBar";
import { useMenuBar } from "@/context/MenuBarContext";

export default function BottomMenuBar() {
  const { isVisible } = useMenuBar();

  return (
    <MenuBar
      className={`bottom-0 flex w-full justify-center transition-all gap-5 border-t bg-card sm:hidden ${
        !isVisible ? "fixed bottom-[-100%] " : "sticky"
      }`}
    />
  );
}

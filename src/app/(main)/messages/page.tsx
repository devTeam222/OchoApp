// "use client"


import { Metadata } from "next";
import ChatWindow from "./ChatWindow";
import SetNavigation from "@/components/SetNavigation";

export const metadata: Metadata = {
  title: "Messages",
};

export default function Page() {
  return <div className="relative w-full max-h-full">
    <SetNavigation navPage="messages" />
      <ChatWindow />
  </div>
}

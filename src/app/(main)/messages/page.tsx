// "use client"


import { Metadata } from "next";
import ChatWindow from "./ChatWindow";

export const metadata: Metadata = {
  title: "Messages",
};

export default function Page() {
  return <div className="relative w-full max-h-full">
      <ChatWindow />
  </div>
}

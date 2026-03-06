import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <ChatWindow onClose={() => setOpen(false)} />}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-7 right-6 z-[9999] w-[62px] h-[62px] rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #155f55 0%, #1a7a6d 100%)",
        }}
        title={open ? "Close Chat" : "Open Chat"}
      >
        {open ? <X size={25} /> : <MessageCircle size={25} />}
      </button>
    </>
  );
}

"use client";

import React, { useState } from "react";
import { BellIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import ChatPanel from "@/components/panels/ChatPanel";
import NotificationsPanel from "@/components/panels/NotificationsPanel";

export function TestPanels() {
  const [openChat, setOpenChat] = useState(false);
  const [openNotifs, setOpenNotifs] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Test buttons */}
      <button
        onClick={() => {
          console.log('[TestPanels] Chat clicked, current state:', openChat);
          setOpenChat(!openChat);
        }}
        className="bg-blue-500 text-white p-2 rounded shadow-lg hover:bg-blue-600"
        title="Test Chat"
      >
        <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
      </button>
      
      <button
        onClick={() => {
          console.log('[TestPanels] Notifications clicked, current state:', openNotifs);
          setOpenNotifs(!openNotifs);
        }}
        className="bg-green-500 text-white p-2 rounded shadow-lg hover:bg-green-600"
        title="Test Notifications"
      >
        <BellIcon className="h-5 w-5" />
      </button>

      {/* Status indicators */}
      <div className="bg-black/80 text-white text-xs p-2 rounded">
        Chat: {openChat ? 'OPEN' : 'CLOSED'} | Notifs: {openNotifs ? 'OPEN' : 'CLOSED'}
      </div>

      {/* Panels */}
      {/* <ChatPanel open={openChat} onClose={() => setOpenChat(false)} /> */}
      {/* <NotificationsPanel open={openNotifs} onClose={() => setOpenNotifs(false)} /> */}
    </div>
  );
}

export default TestPanels;

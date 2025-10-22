import React, { useState, useEffect, useRef } from "react";

const ChatSectionLive = ({ socket, sessionId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Join session & load old messages
    socket.emit("join-session", {
      sessionId,
      userInfo: { id: currentUser.id, name: currentUser.name }
    });

    socket.on("session-data", (data) => {
      if (data.chatMessages) {
        setMessages(data.chatMessages);
      }
    });

    socket.on("new-chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("session-data");
      socket.off("new-chat-message");
    };
  }, [socket, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const msg = {
      sessionId,
      message: newMsg,
      sender: { id: currentUser.id, name: currentUser.name }
    };

    socket.emit("send-chat-message", msg);
    setNewMsg("");
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.sender.id === currentUser.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                m.sender.id === currentUser.id
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-slate-700 text-gray-100 rounded-bl-none"
              }`}
            >
              <p className="text-xs text-gray-300 mb-1">{m.sender.name}</p>
              <p>{m.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-slate-700 flex">
        <input
          type="text"
          className="flex-1 bg-slate-800 text-white rounded-full px-4 py-2 focus:outline-none"
          placeholder="Type your message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
        />
        <button
          type="submit"
          className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatSectionLive;

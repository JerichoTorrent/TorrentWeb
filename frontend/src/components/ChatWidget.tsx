/** @jsxImportSource react */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown"

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, threadId }),
      });

      const contentType = res.headers.get("Content-Type");

      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Sorry, there was a problem." },
        ]);
      } else {
        setThreadId(data.threadId);
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong talking to TorrentBot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transition"
      >
        💬 Ask TorrentBot
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-20 right-6 z-50 bg-[#1e1e22] text-white w-[90vw] max-w-md h-[500px] rounded-xl shadow-xl overflow-hidden border border-gray-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-purple-700">
              <h2 className="text-lg font-semibold">TorrentBot</h2>
              <button onClick={() => setOpen(false)} className="text-white">✖</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${msg.role === "user"
                    ? "bg-purple-800 text-white self-end text-right"
                    : "bg-gray-700 text-gray-100"
                    }`}
                >
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && <p className="text-purple-400 italic">TorrentBot is typing...</p>}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center border-t border-gray-700 p-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-[#2a2a2e] text-white px-3 py-2 rounded-lg text-sm outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="ml-2 bg-yellow-400 text-black px-3 py-2 rounded font-semibold hover:bg-yellow-300 transition"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;

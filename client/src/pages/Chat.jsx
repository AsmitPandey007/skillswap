import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";
import { getSocket } from "../socket";

export default function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`${API_URL}/api/chat/with/${userId}`, {
        headers: { Authorization: token }
      });
      setMessages(res.data.messages || []);
    };
    load().catch(() => {});
  }, [token, userId]);

  useEffect(() => {
    const s = getSocket();
    const onNew = (msg) => {
      if (
        (String(msg.from) === String(userId) && String(msg.to) !== String(userId)) ||
        (String(msg.to) === String(userId) && String(msg.from) !== String(userId))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    s.on("chat:new", onNew);
    return () => s.off("chat:new", onNew);
  }, [userId]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    getSocket().emit("chat:send", { to: userId, text: trimmed });
    setText("");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            Chat
          </h1>
          <Link className="text-blue-600 hover:underline dark:text-blue-300" to="/matches">
            Back to matches
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 h-[60vh] overflow-auto dark:bg-gray-900 dark:text-gray-100">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m._id || `${m.from}-${m.to}-${m.createdAt}`}
                  className={`flex ${
                    String(m.to) === String(userId) ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 dark:bg-gray-800">
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
            placeholder="Type a message..."
            className="flex-1 border rounded-xl px-3 py-3 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100"
          />
          <button
            onClick={send}
            className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


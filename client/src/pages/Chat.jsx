import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import StarRating, { StarDisplay } from "../components/StarRating";
import { API_URL } from "../config";
import { getSocket } from "../socket";

export default function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [ratingStatus, setRatingStatus] = useState(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const loadMessages = async () => {
    const res = await axios.get(`${API_URL}/api/chat/with/${userId}`, {
      headers: { Authorization: token },
    });
    setMessages(res.data.messages || []);
  };

  const loadRatingStatus = async () => {
    const res = await axios.get(`${API_URL}/api/ratings/status/${userId}`, {
      headers: { Authorization: token },
    });
    setRatingStatus(res.data);
    if (res.data.yourRating?.stars) {
      setStars(res.data.yourRating.stars);
      setComment(res.data.yourRating.comment || "");
    }
  };

  useEffect(() => {
    loadMessages().catch(() => {});
    loadRatingStatus().catch(() => {});
  }, [token, userId]);

  useEffect(() => {
    const s = getSocket();
    const onNew = (msg) => {
      const isThisChat =
        (String(msg.from) === String(userId) || String(msg.to) === String(userId));
      if (isThisChat) {
        setMessages((prev) => [...prev, msg]);
        loadRatingStatus().catch(() => {});
      }
    };
    s.on("chat:new", onNew);
    return () => s.off("chat:new", onNew);
  }, [userId, token]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    getSocket().emit("chat:send", { to: userId, text: trimmed });
    setText("");
  };

  const submitRating = async () => {
    if (stars < 1) {
      toast.error("Select at least 1 star");
      return;
    }

    try {
      setSubmittingRating(true);
      await axios.post(
        `${API_URL}/api/ratings`,
        { toUserId: userId, stars, comment },
        { headers: { Authorization: token } }
      );
      toast.success(ratingStatus?.alreadyRated ? "Rating updated" : "Thanks for rating!");
      await loadRatingStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const partnerName = ratingStatus?.partner?.name || "Partner";
  const messagesLeft = Math.max(
    0,
    (ratingStatus?.minMessagesRequired || 3) - (ratingStatus?.messageCount || messages.length)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              Chat with {partnerName}
            </h1>
            {ratingStatus?.partner && (
              <div className="mt-1">
                <StarDisplay
                  rating={ratingStatus.partner.rating}
                  count={ratingStatus.partner.ratingCount}
                />
              </div>
            )}
          </div>
          <Link className="text-blue-600 hover:underline dark:text-blue-300" to="/matches">
            Back to matches
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 h-[55vh] overflow-auto dark:bg-gray-900 dark:text-gray-100">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Say hi to start a session.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m._id || `${m.from}-${m.to}-${m.createdAt}`}
                  className={`flex ${
                    String(m.from) === String(userId) ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      String(m.from) === String(userId)
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        String(m.from) === String(userId)
                          ? "text-gray-400"
                          : "text-blue-100"
                      }`}
                    >
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

        <div className="mt-6 bg-white rounded-2xl shadow p-5 dark:bg-gray-900 dark:text-gray-100">
          <h2 className="text-lg font-semibold mb-1">Rate this session</h2>
          <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
            After a short chat, you can rate {partnerName}. Ratings help others find good skill partners.
          </p>

          {ratingStatus?.canRate ? (
            <div className="space-y-4">
              <StarRating value={stars} onChange={setStars} size="lg" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Optional: what went well?"
                className="w-full border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
              />
              <button
                onClick={submitRating}
                disabled={submittingRating}
                className="bg-amber-500 text-white px-5 py-2 rounded-xl hover:bg-amber-600 transition disabled:opacity-60"
              >
                {submittingRating
                  ? "Saving..."
                  : ratingStatus.alreadyRated
                    ? "Update rating"
                    : "Submit rating"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send {messagesLeft} more message{messagesLeft === 1 ? "" : "s"} to unlock rating.
              ({ratingStatus?.messageCount ?? messages.length} / {ratingStatus?.minMessagesRequired ?? 3})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

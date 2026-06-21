import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";
import { getSocket } from "../socket";

export default function ProjectWorkspace() {
const { projectId } = useParams();

const [messages, setMessages] = useState([]);
const [text, setText] = useState("");

const token = localStorage.getItem("token");

useEffect(() => {
loadMessages();
}, [projectId]);

useEffect(() => {
const socket = getSocket();


socket.emit("project:join", projectId);

socket.on("project:new", (msg) => {
  setMessages((prev) => [...prev, msg]);
});

return () => {
  socket.emit("project:leave", projectId);
  socket.off("project:new");
};


}, [projectId]);

const loadMessages = async () => {
try {
const res = await axios.get(
`${API_URL}/api/project-chat/${projectId}`,
{
headers: {
Authorization: token,
},
}
);

  setMessages(res.data.messages || []);
} catch (err) {
  console.error(err);
}


};

const sendMessage = () => {
const trimmed = text.trim();

if (!trimmed) return;

getSocket().emit("project:send", {
  projectId,
  text: trimmed,
});

setText("");


};

return ( <div className="min-h-screen bg-gray-100 dark:bg-gray-950"> <Navbar />


  <div className="max-w-4xl mx-auto p-6">

    <h1 className="text-3xl font-bold mb-6">
      🚀 Project Workspace
    </h1>

    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 h-[60vh] overflow-y-auto">

      {messages.map((msg) => (
        <div key={msg._id} className="mb-3">
          <div className="font-semibold">
            {msg.sender?.name || "Unknown"}
          </div>

          <div>
            {msg.text}
          </div>
        </div>
      ))}

    </div>

    <div className="mt-4 flex gap-2">

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
        className="flex-1 border rounded-lg px-4 py-3"
      />

      <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-5 rounded-lg"
      >
        Send
      </button>

    </div>

  </div>
</div>


);
}

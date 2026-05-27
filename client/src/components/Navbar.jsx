import { Link, useNavigate } from "react-router-dom";
import { toggleTheme } from "../theme";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { getSocket } from "../socket";

export default function Navbar({ user }) {

  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);


  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/");

  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${API_URL}/api/notifications`, {
        headers: { Authorization: token }
      })
      .then((res) => setUnread(res.data.unreadCount || 0))
      .catch(() => {});

    const s = getSocket();
    const onNotif = () => setUnread((u) => u + 1);
    s.on("notification:new", onNotif);
    return () => s.off("notification:new", onNotif);
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await axios.post(
      `${API_URL}/api/notifications/read-all`,
      {},
      { headers: { Authorization: token } }
    );
    setUnread(0);
  };


  return (

    <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between items-center shadow-lg dark:bg-gray-900">

      <h1 className="text-3xl font-bold">
        SkillSwap
      </h1>


      <div className="flex items-center gap-6">

        <Link
          to="/dashboard"
          className="hover:text-gray-200"
        >
          Dashboard
        </Link>

        <Link
          to="/matches"
          className="hover:text-gray-200"
        >
          Matches
        </Link>

        <button
          onClick={() => toggleTheme()}
          className="bg-white/15 px-3 py-2 rounded-lg hover:bg-white/25 transition"
          type="button"
        >
          Theme
        </button>

        <button
          onClick={markAllRead}
          className="relative bg-white/15 px-3 py-2 rounded-lg hover:bg-white/25 transition"
          type="button"
          title="Mark all notifications read"
        >
          Notifications
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </button>


        {

          user && (

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">

                {user.name?.charAt(0)}

              </div>

              <span className="font-semibold">

                {user.name}

              </span>

            </div>

          )

        }


        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >

          Logout

        </button>

      </div>

    </nav>

  );

}
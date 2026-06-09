import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { StarDisplay } from "../components/StarRating";
import { API_URL } from "../config";
import { getSocket } from "../socket";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/requests/incoming`, {
        headers: { Authorization: token },
      });
      setRequests(res.data.requests || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const s = getSocket();
    const refresh = () => loadRequests();
    s.on("request:new", refresh);
    return () => s.off("request:new", refresh);
  }, []);

  const accept = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/requests/${id}/accept`,
        {},
        { headers: { Authorization: token } }
      );
      toast.success("Request accepted! You can chat now.");
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not accept");
    }
  };

  const decline = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/requests/${id}/decline`,
        {},
        { headers: { Authorization: token } }
      );
      toast.success("Request declined");
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not decline");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Swap Requests</h1>
        <p className="text-gray-500 mb-8 dark:text-gray-400">
          People who want to swap skills with you. Read their note and accept to start chatting.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow text-center dark:bg-gray-900">
            <p className="text-gray-500 text-lg">No pending requests right now.</p>
            <Link to="/matches" className="text-blue-600 hover:underline mt-2 inline-block">
              Browse matches
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-6 rounded-2xl shadow-lg dark:bg-gray-900 dark:text-gray-100"
              >
                <div className="flex items-start gap-4">
                  {req.from?.profileImage ? (
                    <img
                      src={req.from.profileImage}
                      alt={req.from.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                      {req.from?.name?.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{req.from?.name}</h2>
                    <div className="mt-1 mb-3">
                      <StarDisplay
                        rating={req.from?.rating}
                        count={req.from?.ratingCount || 0}
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 dark:bg-amber-950/40 dark:border-amber-900">
                      <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-1">
                        Their note to you
                      </p>
                      <p className="text-gray-800 dark:text-gray-100 italic">
                        &ldquo;{req.note}&rdquo;
                      </p>
                    </div>

                    {req.from?.skillsOffered?.length > 0 && (
                      <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                        Offers: {req.from.skillsOffered.join(", ")}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => accept(req._id)}
                        className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => decline(req._id)}
                        className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl hover:bg-gray-300 transition dark:bg-gray-800 dark:text-gray-100"
                      >
                        Decline
                      </button>
                      <Link
                        to={`/chat/${req.from._id}`}
                        className="text-blue-600 px-2 py-2 hover:underline dark:text-blue-300"
                      >
                        View profile chat
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

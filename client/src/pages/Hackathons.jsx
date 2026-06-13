import { API_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { StarDisplay } from "../components/StarRating";
import { getSocket } from "../socket";
import { Link } from "react-router-dom";

export default function Hackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [requiredRoles, setRequiredRoles] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Application State
  const [applyTarget, setApplyTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [applyNote, setApplyNote] = useState("");
  const [applying, setApplying] = useState(false);

  // Recommendations State
  const [recommendTarget, setRecommendTarget] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recommendationEngine, setRecommendationEngine] = useState("");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/user/profile`, {
        headers: { Authorization: token },
      });
      setCurrentUser(res.data);
    } catch (error) {
      console.error("Profile fetch failed:", error);
    }
  };

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/hackathons`, {
        headers: { Authorization: token },
      });
      setHackathons(res.data.hackathons || []);
    } catch (error) {
      console.error("Hackathons fetch failed:", error);
      toast.error("Failed to load hackathon postings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchHackathons();

    const s = getSocket();
    const handleUpdate = (updatedHackathon) => {
      setHackathons((prev) =>
        prev.map((h) => (h._id === updatedHackathon._id ? updatedHackathon : h))
      );
    };

    s.on("hackathon:application_update", handleUpdate);
    return () => {
      s.off("hackathon:application_update", handleUpdate);
    };
  }, []);

  const handleCreateHackathon = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !description.trim() || !deadline || !teamSize || !requiredRoles) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/hackathons`,
        {
          eventName,
          description,
          deadline,
          teamSize,
          requiredRoles,
          requiredSkills,
        },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Hackathon team request posted!");
      setHackathons((prev) => [res.data.hackathon, ...prev]);
      setShowCreateModal(false);
      // Reset form
      setEventName("");
      setDescription("");
      setDeadline("");
      setTeamSize(3);
      setRequiredRoles("");
      setRequiredSkills("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create team request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!applyTarget || !selectedRole) return;
    if (!applyNote.trim()) {
      toast.error("Please add an introduction note");
      return;
    }

    try {
      setApplying(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/hackathons/${applyTarget._id}/apply`,
        { roleAppliedFor: selectedRole, note: applyNote },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Application submitted!");
      setHackathons((prev) =>
        prev.map((h) => (h._id === applyTarget._id ? res.data.hackathon : h))
      );
      setApplyTarget(null);
      setSelectedRole("");
      setApplyNote("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Application failed");
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateStatus = async (hackathonId, applicationId, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/hackathons/${hackathonId}/applications/${applicationId}/status`,
        { status },
        {
          headers: { Authorization: token },
        }
      );

      toast.success(`Application ${status}!`);
      setHackathons((prev) =>
        prev.map((h) => (h._id === hackathonId ? res.data.hackathon : h))
      );

      // If we are looking at recommendation list and status changes, refresh recommendation exclusions
      if (recommendTarget && recommendTarget._id === hackathonId) {
        fetchRecommendations(hackathonId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  };

  const fetchRecommendations = async (hackathonId) => {
    try {
      setLoadingRecs(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/hackathons/${hackathonId}/recommendations`, {
        headers: { Authorization: token },
      });
      setRecommendations(res.data.recommendations || []);
      setRecommendationEngine(res.data.recommendationEngine || "exact-match");
    } catch (error) {
      console.error("Recommendations fetch failed:", error);
      toast.error("Could not fetch teammate recommendations");
    } finally {
      setLoadingRecs(false);
    }
  };

  const openRecommendations = (hackathon) => {
    setRecommendTarget(hackathon);
    fetchRecommendations(hackathon._id);
  };

  // Filter hackathons by name description, roles, or skills
  const filteredHackathons = hackathons.filter((h) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = h.eventName.toLowerCase().includes(query);
    const descMatch = h.description.toLowerCase().includes(query);
    const rolesMatch = h.requiredRoles.some((role) => role.toLowerCase().includes(query));
    const skillsMatch = h.requiredSkills.some((skill) => skill.toLowerCase().includes(query));
    return nameMatch || descMatch || rolesMatch || skillsMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <Navbar user={currentUser} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              Hackathon Teammate Finder
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Find partners, build hackathon squads, and manage signups before submission deadlines.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 transition duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Team Request
          </button>
        </div>

        {/* Search / Filter Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-6 border border-gray-200/50 dark:border-gray-800/50">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search hackathons by event name, description, required skills, or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Hackathons Feed */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : filteredHackathons.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchQuery ? "No hackathon listings match your search query." : "No hackathon squad requests posted yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredHackathons.map((h) => {
              const isCreator = currentUser && String(h.creator._id) === String(currentUser._id);
              const myApplication = h.applications.find(
                (app) => currentUser && String(app.applicant?._id || app.applicant) === String(currentUser._id)
              );
              const acceptedTeammates = h.applications.filter((app) => app.status === "accepted");
              const isExpired = new Date(h.deadline) < new Date();

              return (
                <div
                  key={h._id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border ${
                    isExpired
                      ? "border-gray-200 dark:border-gray-800 opacity-75"
                      : "border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/20 dark:hover:border-indigo-500/25"
                  } transition duration-200 flex flex-col gap-5`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                          {h.eventName}
                        </h2>
                        {isCreator && (
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-800/40">
                            Team Leader
                          </span>
                        )}
                        {isExpired && (
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-red-950/30 dark:text-red-300">
                            Deadline Passed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                        <span>Initiator:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {h.creator.name}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <StarDisplay rating={h.creator.rating} count={h.creator.ratingCount} size="sm" />
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                        isExpired
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200/20"
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/30 dark:border-amber-800/30"
                      }`}>
                        📅 Deadline: {new Date(h.deadline).toLocaleString()}
                      </span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-medium border border-indigo-200/30 dark:border-indigo-800/30">
                        👥 Team slots: {acceptedTeammates.length + 1} / {h.teamSize} filled
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {h.description}
                  </p>

                  {/* Roles and Skills Required */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                        Required Roles
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {h.requiredRoles.map((role, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50/70 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-indigo-200/20 dark:border-indigo-900/30"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {h.requiredSkills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                          Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {h.requiredSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-purple-200/20 dark:border-purple-800/20"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Teammates List */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      Teammates
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/10 px-3 py-1.5 rounded-xl border border-indigo-200/20 dark:border-indigo-800/20">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                          {h.creator.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                          {h.creator.name} (Leader)
                        </span>
                      </div>
                      {acceptedTeammates.map((app, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-800/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                            {app.applicant.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium dark:text-gray-300">
                            {app.applicant.name}
                          </span>
                          <span className="bg-gray-200 dark:bg-gray-800 text-[10px] px-1.5 py-0.5 rounded text-gray-500">
                            {app.roleAppliedFor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between items-center gap-4 flex-wrap mt-auto">
                    {/* Non-creator actions */}
                    {!isCreator && (
                      <div className="w-full flex justify-end">
                        {myApplication ? (
                          <div className="w-full flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Applied on {new Date(myApplication.appliedAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {myApplication.status === "pending" && (
                                <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50">
                                  ⏳ Pending Review (Role: {myApplication.roleAppliedFor})
                                </span>
                              )}
                              {myApplication.status === "accepted" && (
                                <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-green-200/50 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50">
                                  ✅ Approved Teammate (Role: {myApplication.roleAppliedFor})
                                </span>
                              )}
                              {myApplication.status === "rejected" && (
                                <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-red-200/50 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50">
                                  ❌ Declined (Role: {myApplication.roleAppliedFor})
                                </span>
                              )}
                            </div>
                            {myApplication.note && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-950 p-3 rounded-xl w-full border border-gray-200/40 dark:border-gray-800/40 italic">
                                &ldquo;{myApplication.note}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : isExpired ? (
                          <span className="text-gray-400 dark:text-gray-600 font-semibold py-2">
                            🚫 Closed (Deadline passed)
                          </span>
                        ) : (acceptedTeammates.length + 1) >= h.teamSize ? (
                          <span className="text-gray-400 dark:text-gray-500 font-semibold py-2">
                            🚫 Team is full
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setApplyTarget(h);
                              setSelectedRole(h.requiredRoles[0] || "");
                              setApplyNote(
                                `Hi! I'd love to join your hackathon squad. I think I'd be a great fit.`
                              );
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 transition active:scale-98"
                          >
                            Apply to Join Team
                          </button>
                        )}
                      </div>
                    )}

                    {/* Creator actions */}
                    {isCreator && (
                      <div className="w-full flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                          <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            Applications Received
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                              {h.applications.length}
                            </span>
                          </h3>

                          {/* RECOMMENDATIONS BUTTON */}
                          {!isExpired && (
                            <button
                              onClick={() => openRecommendations(h)}
                              className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200/30 dark:border-indigo-800/40 transition flex items-center gap-1"
                            >
                              💡 Find Recommended Teammates
                            </button>
                          )}
                        </div>

                        {h.applications.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-1">
                            No applications received yet. Click &quot;Find Recommended Teammates&quot; to invite people!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {h.applications.map((app) => (
                              <div
                                key={app._id}
                                className="bg-gray-50 dark:bg-gray-950/50 border border-gray-200/50 dark:border-gray-800/50 p-4 rounded-xl flex flex-col gap-3"
                              >
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                      {app.applicant.name.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {app.applicant.name}
                                      </h4>
                                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mt-0.5">
                                        Applying for: {app.roleAppliedFor}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {app.status === "pending" ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateStatus(h._id, app._id, "accepted")}
                                          disabled={isExpired || (acceptedTeammates.length + 1) >= h.teamSize}
                                          title={(acceptedTeammates.length + 1) >= h.teamSize ? "Team is full" : "Accept teammate"}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleUpdateStatus(h._id, app._id, "rejected")}
                                          disabled={isExpired}
                                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                        >
                                          Decline
                                        </button>
                                      </>
                                    ) : (
                                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                        app.status === "accepted"
                                          ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-300"
                                          : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-300"
                                      }`}>
                                        {app.status}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {app.note && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-200/20 dark:border-gray-800/20 italic">
                                    &ldquo;{app.note}&rdquo;
                                  </p>
                                )}

                                {app.applicant.skillsOffered?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-xs text-gray-400 mr-1">Skills Offered:</span>
                                    {app.applicant.skillsOffered.map((sk, index) => (
                                      <span
                                        key={index}
                                        className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE HACKATHON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200/50 dark:border-gray-800/50 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  Create Hackathon Team Request
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Form a team to build something epic together.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateHackathon} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Hackathon / Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Hash Code 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  maxLength={150}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Team Pitch & Project Description *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="Brief description of the event, what project idea you want to build, and what kind of support you need..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Required Roles (comma-separated list) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Developer, ML Engineer, UI Designer"
                  value={requiredRoles}
                  onChange={(e) => setRequiredRoles(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Separate with commas. These will be options for applicants.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Required Skills (comma-separated list)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Python, Figma, PyTorch"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  This list of skills is used to match and recommend suitable teammates!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Team Size *
                  </label>
                  <input
                    type="number"
                    min={2}
                    required
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value) || 2)}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-semibold shadow-md transition"
                >
                  {submitting ? "Posting..." : "Create Squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY TO HACKATHON MODAL */}
      {applyTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200/50 dark:border-gray-800/50 animate-scaleUp">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
              Apply to join squad for &ldquo;{applyTarget.eventName}&rdquo;
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select your role and tell the leader how you can contribute to the team.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Role you are applying for *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {applyTarget.requiredRoles.map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Introduction / Skills Pitch *
                </label>
                <textarea
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Talk about your experience, past hackathons, and availability..."
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-1"
                />
                <div className="text-xs text-gray-400 text-right">
                  {applyNote.length} / 500 characters
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
              <button
                type="button"
                onClick={() => {
                  setApplyTarget(null);
                  setSelectedRole("");
                  setApplyNote("");
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-semibold shadow-md transition"
              >
                {applying ? "Applying..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDED TEAMMATES MODAL */}
      {recommendTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200/50 dark:border-gray-800/50 animate-scaleUp max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-800 pb-3 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  Teammate Recommendations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  AI & exact matching based on required skills:{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {recommendTarget.requiredSkills.join(", ") || "None specified"}
                  </strong>
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                  Engine: {recommendationEngine === "semantic-ai" ? "Semantic AI" : "Exact match"}
                </p>
              </div>
              <button
                onClick={() => {
                  setRecommendTarget(null);
                  setRecommendations([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recommendations List Container */}
            <div className="overflow-y-auto flex-grow pr-1 py-2 space-y-4">
              {loadingRecs ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : recommendations.length === 0 ? (
                <p className="text-center text-gray-500 py-8 italic dark:text-gray-400">
                  No suitable users found to recommend. Try adding different required skills!
                </p>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="bg-gray-50 dark:bg-gray-950 border border-gray-200/50 dark:border-gray-800/50 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-start"
                  >
                    <div className="flex items-start gap-3 flex-grow">
                      <div className="w-11 h-11 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                        {rec.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">
                            {rec.name}
                          </h4>
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-green-950/40 dark:text-green-300">
                            🎯 {rec.matchPercentage}% Skills Match
                          </span>
                        </div>
                        <StarDisplay rating={rec.rating} count={rec.ratingCount} size="sm" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                          {rec.bio || "No biography provided."}
                        </p>
                        {rec.skillsOffered?.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center pt-1">
                            <span className="text-[10px] text-gray-400">Offers:</span>
                            {rec.skillsOffered.map((sk, index) => {
                              const isExactMatched = rec.exactMatches.some(
                                (em) => em.toLowerCase() === sk.toLowerCase()
                              );
                              const isSemanticMatched = rec.semanticMatches.some(
                                (sm) => sm.offered.toLowerCase() === sk.toLowerCase()
                              );
                              return (
                                <span
                                  key={index}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    isExactMatched
                                      ? "bg-purple-100 text-purple-800 border-purple-200/50 dark:bg-purple-950 dark:text-purple-300"
                                      : isSemanticMatched
                                      ? "bg-indigo-100 text-indigo-800 border-indigo-200/50 dark:bg-indigo-950 dark:text-indigo-300"
                                      : "bg-gray-150 text-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800"
                                  }`}
                                >
                                  {sk}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 self-end md:self-center">
                      <Link
                        to={`/chat/${rec._id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition inline-block text-center"
                      >
                        Invite & Chat
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <button
                onClick={() => {
                  setRecommendTarget(null);
                  setRecommendations([]);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

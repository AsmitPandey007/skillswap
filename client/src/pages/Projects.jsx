import { API_URL } from "../config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { StarDisplay } from "../components/StarRating";
import { getSocket } from "../socket";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSkills, setNewSkills] = useState("");
  const [newTeamSize, setNewTeamSize] = useState(2);
  const [newDuration, setNewDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Application State
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyNote, setApplyNote] = useState("");
  const [applying, setApplying] = useState(false);

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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/projects`, {
        headers: { Authorization: token },
      });
      setProjects(res.data.projects || []);
    } catch (error) {
      console.error("Projects fetch failed:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProjects();

    const s = getSocket();
    const handleUpdate = (updatedProject) => {
      setProjects((prev) =>
        prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
      );
    };

    s.on("project:application_update", handleUpdate);
    return () => {
      s.off("project:application_update", handleUpdate);
    };
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDuration.trim() || !newTeamSize) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/projects`,
        {
          title: newTitle,
          description: newDescription,
          requiredSkills: newSkills,
          teamSize: newTeamSize,
          duration: newDuration,
        },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Project posted successfully!");
      setProjects((prev) => [res.data.project, ...prev]);
      setShowCreateModal(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewSkills("");
      setNewTeamSize(2);
      setNewDuration("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!applyTarget) return;
    if (!applyNote.trim()) {
      toast.error("Please add a note to introduce yourself");
      return;
    }

    try {
      setApplying(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/projects/${applyTarget._id}/apply`,
        { note: applyNote },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Application submitted!");
      setProjects((prev) =>
        prev.map((p) => (p._id === applyTarget._id ? res.data.project : p))
      );
      setApplyTarget(null);
      setApplyNote("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Application failed");
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateStatus = async (projectId, applicationId, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/projects/${projectId}/applications/${applicationId}/status`,
        { status },
        {
          headers: { Authorization: token },
        }
      );

      toast.success(`Application ${status}!`);
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? res.data.project : p))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  };

  const handleStartProject = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
  
      const res = await axios.post(
        `${API_URL}/api/projects/${projectId}/start`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );
  
      toast.success("Project started successfully!");
  
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? res.data.project : p
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Could not start project"
      );
    }
  };



  // Filter projects by title description or skills
  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = project.title.toLowerCase().includes(query);
    const descMatch = project.description.toLowerCase().includes(query);
    const skillsMatch = project.requiredSkills.some((skill) =>
      skill.toLowerCase().includes(query)
    );
    return titleMatch || descMatch || skillsMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <Navbar user={currentUser} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              Project Marketplace
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Find side projects, build teams, and collaborate with skilled developers.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Post a Project
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
              placeholder="Search projects by title, description, or required skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchQuery ? "No projects match your search query." : "No projects posted yet. Be the first to create one!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProjects.map((project) => {
              const isOwner = currentUser && String(project.owner._id) === String(currentUser._id);
              const myApplication = project.applications.find(
                (app) => currentUser && String(app.applicant?._id || app.applicant) === String(currentUser._id)
              );


              const acceptedTeammates = project.applications.filter((app) => app.status === "accepted");

              return (
                <div
                  key={project._id}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/20 dark:hover:border-blue-500/25 transition-all duration-200 flex flex-col gap-5"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                          {project.title}
                        </h2>
                        {isOwner && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/40 dark:border-blue-800/40">
                            Your Project
                          </span>
                        )}
                      </div>
                      {/* Owner details */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                        <span>by</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {project.owner.name}
                        </span>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <StarDisplay rating={project.owner.rating} count={project.owner.ratingCount} size="sm" />
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex gap-2">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-sm font-medium border border-gray-200/30 dark:border-gray-700/30">
                        ⏱️ {project.duration}
                      </span>

                      <span className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg text-sm font-medium border border-green-200/30 dark:border-green-800/30">
                        👥 {acceptedTeammates.length} / {project.teamSize} Teammates
                      </span>
                      <span
  className={`px-3 py-1 rounded-lg text-sm font-medium border
  ${
    project.status === "active"
      ? "bg-green-100 text-green-700"
      : project.status === "completed"
      ? "bg-blue-100 text-blue-700"
      : project.status === "aborted"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
{(project.status || "recruiting").toUpperCase()}
</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {project.description}
                  </p>

                  {/* Required Skills */}
                  {project.requiredSkills?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                        Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {project.requiredSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-200/30 dark:border-purple-800/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teammates List */}
                  {acceptedTeammates.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                        Teammates Accepted
                      </h4>
                      <div className="flex flex-wrap gap-3">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Section */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between items-center gap-4 flex-wrap mt-auto">
                    {/* Non-owner: Apply actions */}
                    {!isOwner && (
                      <div className="w-full flex justify-end">
                        {myApplication ? (
                          <div className="w-full flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              You applied on {new Date(myApplication.appliedAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {myApplication.status === "pending" && (
                                <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50">
                                  ⏳ Pending Review
                                </span>
                              )}
                              {myApplication.status === "accepted" && (
                                <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-green-200/50 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50">
                                  ✅ Joined Team
                                </span>
                              )}
                              {myApplication.status === "rejected" && (
                                <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-xl text-sm font-semibold border border-red-200/50 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50">
                                  ❌ Declined
                                </span>
                              )}
                            </div>
                            {myApplication.note && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-950 p-3 rounded-xl w-full border border-gray-200/40 dark:border-gray-800/40 italic">
                                &ldquo;{myApplication.note}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : acceptedTeammates.length >= project.teamSize ? (
                          <span className="text-gray-400 dark:text-gray-500 font-semibold py-2">
                            🚫 Team is full
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setApplyTarget(project);
                              setApplyNote(
                                `Hi! I would love to help you build ${project.title}. I have experience that matches what you are looking for.`
                              );
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 transition active:scale-98"
                          >
                            Apply to Join
                          </button>
                        )}
                      </div>
                    )}

                    {/* Owner: Manage Applications */}
                    {isOwner && (
                      <div className="w-full">

{(project.status || "recruiting") === "recruiting" ? (
  <div className="mb-4">
    <button
      onClick={() => handleStartProject(project._id)}
      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-semibold"
    >
      🚀 Start Project
    </button>
  </div>
) : project.status === "active" ? (
  <div className="mb-4">
    <button
      onClick={() =>
        navigate(`/projects/${project._id}/workspace`)
      }
      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold"
    >
      🚀 Open Workspace
    </button>
  </div>
) : null}

                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                          
                          Applications Received
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {project.applications.length}
                          </span>
                        </h3>

                        {project.applications.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">
                            No applications received yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {project.applications.map((app) => (
                              <div
                                key={app._id}
                                className="bg-gray-50 dark:bg-gray-950/50 border border-gray-200/50 dark:border-gray-800/50 p-4 rounded-xl flex flex-col gap-3"
                              >
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                      {app.applicant.name.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {app.applicant.name}
                                      </h4>
                                      <div className="mt-0.5">
                                        <StarDisplay
                                          rating={app.applicant.rating}
                                          count={app.applicant.ratingCount}
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {app.status === "pending" ? (
                                      <>
                                        <button
                                          onClick={() => handleUpdateStatus(project._id, app._id, "accepted")}
                                          disabled={acceptedTeammates.length >= project.teamSize}
                                          title={acceptedTeammates.length >= project.teamSize ? "Team is full" : "Accept teammate"}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleUpdateStatus(project._id, app._id, "rejected")}
                                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
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

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200/50 dark:border-gray-800/50 animate-scaleUp">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  Post a Project
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Provide details to recruit the perfect teammate.
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

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Chat Application"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={150}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe the project goals, tech stack, and what you aim to achieve..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Required Skills
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated, e.g. React, Node.js, TailwindCSS"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Team Size (Teammates needed)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTeamSize}
                    onChange={(e) => setNewTeamSize(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 months, 3 weeks"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-semibold shadow-md transition"
                >
                  {submitting ? "Posting..." : "Post Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {applyTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200/50 dark:border-gray-800/50 animate-scaleUp">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
              Apply to join &ldquo;{applyTarget.title}&rdquo;
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Write a short message to the project owner explaining why you want to join and how you can help.
            </p>

            <textarea
              value={applyNote}
              onChange={(e) => setApplyNote(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell them about your skills, availability, and why this project excites you..."
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-2"
            />
            <div className="text-xs text-gray-400 text-right mb-4">
              {applyNote.length} / 500 characters
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setApplyTarget(null);
                  setApplyNote("");
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl font-semibold shadow-md transition"
              >
                {applying ? "Applying..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

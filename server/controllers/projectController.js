const Project = require("../models/project");
const User = require("../models/user");
const Notification = require("../models/notification");

function emitToUser(req, userId, event, payload) {
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

async function notifyUser(req, userId, { type, title, body, data }) {
  const notif = await Notification.create({
    user: userId,
    type,
    title,
    body,
    data,
  });
  emitToUser(req, userId, "notification:new", notif);
  return notif;
}

// Create project posting
exports.createProject = async (req, res) => {
  try {
    const { title, description, requiredSkills, teamSize, duration } = req.body;

    if (!title || !description || !teamSize || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const size = parseInt(teamSize);
    if (isNaN(size) || size < 1) {
      return res.status(400).json({ message: "Team size must be at least 1" });
    }

    const skills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : String(requiredSkills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const project = await Project.create({
      owner: req.user.id,
      title: String(title).trim().slice(0, 150),
      description: String(description).trim().slice(0, 2000),
      requiredSkills: skills,
      teamSize: size,
      duration: String(duration).trim(),
    });

    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name profileImage rating ratingCount skillsOffered")
      .lean();

    res.status(201).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all projects
exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate("owner", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to join a project
exports.applyToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { note } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.owner) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot apply to your own project" });
    }

    const alreadyApplied = project.applications.some(
      (app) => String(app.applicant) === String(req.user.id)
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied to this project" });
    }

    const trimmedNote = String(note || "").trim().slice(0, 500);

    project.applications.push({
      applicant: req.user.id,
      note: trimmedNote,
      status: "pending",
    });

    await project.save();

    const applicantUser = await User.findById(req.user.id).select("name");

    await notifyUser(req, project.owner, {
      type: "project_application",
      title: "New project application",
      body: `${applicantUser.name} applied to "${project.title}"`,
      data: { projectId: project._id },
    });

    const updatedProject = await Project.findById(projectId)
      .populate("owner", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    // Notify the owner of the project about the updated application list in real-time
    emitToUser(req, project.owner, "project:application_update", updatedProject);

    res.json({
      message: "Application submitted successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept or reject an application
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id: projectId, appId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project owner can update application status" });
    }

    const application = project.applications.id(appId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (status === "accepted") {
      const acceptedCount = project.applications.filter((a) => a.status === "accepted").length;
      if (acceptedCount >= project.teamSize) {
        return res.status(400).json({ message: "Team is already full" });
      }
    }

    application.status = status;
    await project.save();

    const ownerUser = await User.findById(req.user.id).select("name");

    await notifyUser(req, application.applicant, {
      type: "project_application_status",
      title: status === "accepted" ? "Application Accepted!" : "Application Declined",
      body: `${ownerUser.name} ${status} your application for "${project.title}"`,
      data: { projectId: project._id, status },
    });

    const updatedProject = await Project.findById(projectId)
      .populate("owner", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    // Broadcast the update to the applicant and owner
    emitToUser(req, application.applicant, "project:application_update", updatedProject);
    emitToUser(req, project.owner, "project:application_update", updatedProject);

    res.json({
      message: `Application ${status} successfully`,
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//-----------------------------

exports.startProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Only owner can start
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({
        message: "Only project owner can start project",
      });
    }

    // Already started
    if (project.status !== "recruiting") {
      return res.status(400).json({
        message: "Project already started",
      });
    }

    const acceptedMembers = project.applications.filter(
      (app) => app.status === "accepted"
    );

    if (acceptedMembers.length < project.teamSize) {
      return res.status(400).json({
        message: "Team is not full yet",
      });
    }

    project.status = "active";

    await project.save();

    res.json({
      message: "Project started successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

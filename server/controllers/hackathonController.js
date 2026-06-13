const Hackathon = require("../models/hackathon");
const User = require("../models/user");
const Notification = require("../models/notification");
const {
  embedSkillList,
  isEmbeddingAvailable,
  findExactMatches,
  findSemanticSkillMatches,
  ensureUserEmbeddings,
} = require("../services/embeddingService");

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

// Create hackathon team request
exports.createHackathon = async (req, res) => {
  try {
    const { eventName, description, deadline, teamSize, requiredRoles, requiredSkills } = req.body;

    if (!eventName || !description || !deadline || !teamSize || !requiredRoles) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const size = parseInt(teamSize);
    if (isNaN(size) || size < 2) {
      return res.status(400).json({ message: "Team size must be at least 2 (creator + teammates)" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date" });
    }

    if (deadlineDate < new Date()) {
      return res.status(400).json({ message: "Deadline must be in the future" });
    }

    const roles = Array.isArray(requiredRoles)
      ? requiredRoles.map((r) => String(r).trim()).filter(Boolean)
      : String(requiredRoles || "")
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);

    if (roles.length === 0) {
      return res.status(400).json({ message: "At least one required role is needed" });
    }

    const skills = Array.isArray(requiredSkills)
      ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : String(requiredSkills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    let requiredSkillsVectors = [];
    if (isEmbeddingAvailable() && skills.length > 0) {
      try {
        requiredSkillsVectors = await embedSkillList(skills);
      } catch (err) {
        console.error("Failed to generate requiredSkills vectors:", err.message);
      }
    }

    const hackathon = await Hackathon.create({
      creator: req.user.id,
      eventName: String(eventName).trim().slice(0, 150),
      description: String(description).trim().slice(0, 2000),
      deadline: deadlineDate,
      teamSize: size,
      requiredRoles: roles,
      requiredSkills: skills,
      requiredSkillsVectors,
    });

    const populatedHackathon = await Hackathon.findById(hackathon._id)
      .populate("creator", "name profileImage rating ratingCount skillsOffered")
      .lean();

    res.status(201).json({
      message: "Hackathon team request created successfully",
      hackathon: populatedHackathon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all hackathons
exports.listHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find()
      .sort({ createdAt: -1 })
      .populate("creator", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    res.json({ hackathons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to join a hackathon team
exports.applyToHackathon = async (req, res) => {
  try {
    const hackathonId = req.params.id;
    const { roleAppliedFor, note } = req.body;

    if (!roleAppliedFor) {
      return res.status(400).json({ message: "Please specify the role you are applying for" });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    // Check deadline
    if (new Date() > new Date(hackathon.deadline)) {
      return res.status(400).json({ message: "Deadline has already passed. Applications are closed." });
    }

    if (String(hackathon.creator) === String(req.user.id)) {
      return res.status(400).json({ message: "You are the creator of this hackathon team" });
    }

    const alreadyApplied = hackathon.applications.some(
      (app) => String(app.applicant) === String(req.user.id)
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied to this team" });
    }

    const trimmedNote = String(note || "").trim().slice(0, 500);

    hackathon.applications.push({
      applicant: req.user.id,
      roleAppliedFor: String(roleAppliedFor).trim(),
      note: trimmedNote,
      status: "pending",
    });

    await hackathon.save();

    const applicantUser = await User.findById(req.user.id).select("name");

    await notifyUser(req, hackathon.creator, {
      type: "hackathon_application",
      title: "New hackathon application",
      body: `${applicantUser.name} applied for "${roleAppliedFor}" on "${hackathon.eventName}"`,
      data: { hackathonId: hackathon._id },
    });

    const updatedHackathon = await Hackathon.findById(hackathonId)
      .populate("creator", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    emitToUser(req, hackathon.creator, "hackathon:application_update", updatedHackathon);

    res.json({
      message: "Application submitted successfully",
      hackathon: updatedHackathon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept or reject application
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id: hackathonId, appId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    // Check deadline
    if (new Date() > new Date(hackathon.deadline)) {
      return res.status(400).json({ message: "Deadline has passed. Cannot process applications." });
    }

    if (String(hackathon.creator) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the team creator can update status" });
    }

    const application = hackathon.applications.id(appId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (status === "accepted") {
      const acceptedCount = hackathon.applications.filter((a) => a.status === "accepted").length;
      if (acceptedCount >= hackathon.teamSize - 1) {
        return res.status(400).json({ message: "Team is already full (maximum size reached)" });
      }
    }

    application.status = status;
    await hackathon.save();

    const creatorUser = await User.findById(req.user.id).select("name");

    await notifyUser(req, application.applicant, {
      type: "hackathon_application_status",
      title: status === "accepted" ? "Hackathon Invite Accepted!" : "Hackathon Application Declined",
      body: `${creatorUser.name} ${status} your application for "${hackathon.eventName}"`,
      data: { hackathonId: hackathon._id, status },
    });

    const updatedHackathon = await Hackathon.findById(hackathonId)
      .populate("creator", "name profileImage rating ratingCount skillsOffered")
      .populate("applications.applicant", "name profileImage rating ratingCount skillsOffered")
      .lean();

    emitToUser(req, application.applicant, "hackathon:application_update", updatedHackathon);
    emitToUser(req, hackathon.creator, "hackathon:application_update", updatedHackathon);

    res.json({
      message: `Application ${status} successfully`,
      hackathon: updatedHackathon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Teammate recommendations logic
exports.getTeammateRecommendations = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    // Get all users except creator and accepted teammates
    const acceptedTeammateIds = hackathon.applications
      .filter((app) => app.status === "accepted")
      .map((app) => String(app.applicant));

    const excludeIds = [String(hackathon.creator), ...acceptedTeammateIds];

    const users = await User.find({
      _id: { $nin: excludeIds },
      skillsOffered: { $exists: true, $not: { $size: 0 } },
    });

    const recommendations = [];
    const useSemantic = isEmbeddingAvailable() && hackathon.requiredSkillsVectors?.length > 0;

    for (const user of users) {
      let candidate = user;
      if (useSemantic) {
        candidate = await ensureUserEmbeddings(user);
      }

      const exactMatches = findExactMatches(hackathon.requiredSkills, candidate.skillsOffered);

      const semanticMatches = useSemantic
        ? findSemanticSkillMatches(hackathon.requiredSkillsVectors, candidate.skillsOfferedVectors)
        : [];

      let matchPercentage = 0;
      const required = hackathon.requiredSkills || [];

      if (required.length === 0) {
        matchPercentage = 100;
      } else {
        let totalScore = 0;
        const exactSet = new Set(exactMatches.map((s) => s.toLowerCase().trim()));

        for (const reqSkill of required) {
          const reqLower = reqSkill.toLowerCase().trim();
          if (exactSet.has(reqLower)) {
            totalScore += 100;
          } else {
            const skillSemMatches = semanticMatches.filter(
              (m) => m.wanted.toLowerCase().trim() === reqLower
            );
            if (skillSemMatches.length > 0) {
              const maxSim = Math.max(...skillSemMatches.map((m) => m.similarity));
              totalScore += maxSim;
            }
          }
        }
        matchPercentage = Math.round(totalScore / required.length);
      }

      recommendations.push({
        _id: candidate._id,
        name: candidate.name,
        profileImage: candidate.profileImage,
        bio: candidate.bio,
        rating: candidate.rating,
        ratingCount: candidate.ratingCount || 0,
        skillsOffered: candidate.skillsOffered,
        matchPercentage,
        exactMatches,
        semanticMatches: semanticMatches.slice(0, 3), // limit semantic pairs details in payload
      });
    }

    // Sort by match percentage descending
    const sorted = recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      recommendations: sorted,
      recommendationEngine: useSemantic ? "semantic-ai" : "exact-match",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Project = require("../models/project");
const ProjectMessage = require("../models/projectMessage");

exports.getProjectMessages = async (req, res) => {
try {
const projectId = req.params.projectId;


const project = await Project.findById(projectId);

if (!project) {
  return res.status(404).json({
    message: "Project not found",
  });
}

const isOwner =
  String(project.owner) === String(req.user.id);

const isMember = project.applications.some(
  (app) =>
    app.status === "accepted" &&
    String(app.applicant) === String(req.user.id)
);

if (!isOwner && !isMember) {
  return res.status(403).json({
    message: "Access denied",
  });
}

const messages = await ProjectMessage.find({
  project: projectId,
})
  .populate("sender", "name")
  .sort({ createdAt: 1 })
  .lean();

res.json({ messages });


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

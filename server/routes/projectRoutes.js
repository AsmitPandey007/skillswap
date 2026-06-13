const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  createProject,
  listProjects,
  applyToProject,
  updateApplicationStatus,
} = require("../controllers/projectController");

// Create a project posting
router.post("/", auth, createProject);

// List all project postings
router.get("/", auth, listProjects);

// Apply to join a project
router.post("/:id/apply", auth, applyToProject);

// Accept or reject an application
router.post("/:id/applications/:appId/status", auth, updateApplicationStatus);

module.exports = router;

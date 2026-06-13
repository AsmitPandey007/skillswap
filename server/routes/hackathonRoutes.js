const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  createHackathon,
  listHackathons,
  applyToHackathon,
  updateApplicationStatus,
  getTeammateRecommendations,
} = require("../controllers/hackathonController");

// Create a hackathon team request
router.post("/", auth, createHackathon);

// List all hackathon team requests
router.get("/", auth, listHackathons);

// Apply to join a hackathon team
router.post("/:id/apply", auth, applyToHackathon);

// Accept or reject application
router.post("/:id/applications/:appId/status", auth, updateApplicationStatus);

// Get teammate recommendations based on hackathon required skills
router.get("/:id/recommendations", auth, getTeammateRecommendations);

module.exports = router;

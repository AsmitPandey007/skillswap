const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  sendRequest,
  listConnections,
  listIncoming,
  getStatusWithUser,
  acceptRequest,
  declineRequest,
} = require("../controllers/swapRequestController");

router.post("/", auth, sendRequest);
router.get("/connections", auth, listConnections);
router.get("/incoming", auth, listIncoming);
router.get("/status/:userId", auth, getStatusWithUser);
router.post("/:id/accept", auth, acceptRequest);
router.post("/:id/decline", auth, declineRequest);

module.exports = router;

const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const {
  listNotifications,
  markAllRead
} = require("../controllers/notificationController");

router.get("/", auth, listNotifications);
router.post("/read-all", auth, markAllRead);

module.exports = router;


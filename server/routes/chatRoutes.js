const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const { getMessagesWithUser } = require("../controllers/chatController");

router.get("/with/:userId", auth, getMessagesWithUser);

module.exports = router;


const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
getProjectMessages,
} = require("../controllers/projectChatController");

router.get(
"/:projectId",
auth,
getProjectMessages
);

module.exports = router;

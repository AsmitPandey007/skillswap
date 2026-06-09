const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getRatingStatus, submitRating } = require("../controllers/ratingController");

router.get("/status/:userId", auth, getRatingStatus);
router.post("/", auth, submitRating);

module.exports = router;

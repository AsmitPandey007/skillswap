const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
  findMatches
} = require("../controllers/matchController");


// Protected route
router.get("/", auth, findMatches);


module.exports = router;
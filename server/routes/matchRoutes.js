const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
  getMatches
} = require("../controllers/matchController");


// Protected route
router.get("/", auth, getMatches);


module.exports = router;
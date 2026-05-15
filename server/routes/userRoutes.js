const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
  updateProfile,
  getProfile
} = require("../controllers/userController");


// Protected route
router.put("/update", auth, updateProfile);
router.get("/profile", auth, getProfile);


module.exports = router;
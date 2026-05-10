const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const {
  updateProfile
} = require("../controllers/userController");


// Protected route
router.put("/update", auth, updateProfile);


module.exports = router;
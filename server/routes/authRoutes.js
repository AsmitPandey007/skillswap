const router = require("express").Router();

const dbReady = require("../middleware/dbReady");

const {
  register,
  login
} = require("../controllers/authController");


// Register route
router.post("/register", dbReady, register);


// Login route
router.post("/login", dbReady, login);


module.exports = router;
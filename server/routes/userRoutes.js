const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const {
  updateProfile,
  getProfile,
  uploadProfileImage
} = require("../controllers/userController");


router.put(
  "/update",
  auth,
  updateProfile
);


router.get(
  "/profile",
  auth,
  getProfile
);


router.post(
  "/upload-image",
  auth,
  upload.single("image"),
  uploadProfileImage
);


module.exports = router;
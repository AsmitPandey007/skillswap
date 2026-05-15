const User = require("../models/User");


// UPDATE PROFILE
exports.updateProfile = async (req, res) => {

  try {

    const {
      bio,
      skillsOffered,
      skillsWanted
    } = req.body;

    const user = await User.findByIdAndUpdate(

      req.user.id,

      {
        bio,
        skillsOffered,
        skillsWanted
      },

      { new: true }

    );

    res.json({
      message: "Profile updated",
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// GET PROFILE
exports.getProfile = async (req, res) => {

  try {

    const user = await User.findById(
      req.user.id
    );

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
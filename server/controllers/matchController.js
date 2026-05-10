const User = require("../models/User");


// FIND MATCHES
exports.findMatches = async (req, res) => {

  try {

    // Logged-in user
    const currentUser = await User.findById(
      req.user.id
    );

    // Get all users except current user
    const users = await User.find({
      _id: { $ne: req.user.id }
    });

    let matches = [];

    users.forEach((user) => {

      // Check if user offers skill I want
      const offeredMatch = user.skillsOffered.some(
        (skill) =>
          currentUser.skillsWanted.includes(skill)
      );

      // Check if user wants skill I offer
      const wantedMatch = user.skillsWanted.some(
        (skill) =>
          currentUser.skillsOffered.includes(skill)
      );

      // Perfect exchange match
      if (offeredMatch && wantedMatch) {

        matches.push(user);

      }

    });

    res.json({
      matches
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
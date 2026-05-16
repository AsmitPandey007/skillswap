const User = require("../models/User");


// GET MATCHES
exports.getMatches = async (req, res) => {

  try {

    // Current logged in user
    const currentUser = await User.findById(
      req.user.id
    );


    // Get all other users
    const users = await User.find({

      _id: {
        $ne: req.user.id
      }

    });


    // Store matched users
    const matches = [];


    users.forEach((user) => {

      // Find matched skills
      const matchedSkills = currentUser.skillsWanted.filter(

        (skill) =>

          user.skillsOffered.includes(skill)

      );


      // Calculate percentage
      const matchPercentage = Math.round(

        (matchedSkills.length /

          currentUser.skillsWanted.length) * 100

      );


      // Only include if at least 1 skill matched
      if (matchedSkills.length > 0) {

        matches.push({

          _id: user._id,

          name: user.name,

          bio: user.bio,

          skillsOffered: user.skillsOffered,

          skillsWanted: user.skillsWanted,

          matchedSkills,

          matchPercentage

        });

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
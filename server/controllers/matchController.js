const User = require("../models/user");

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);


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
          profileImage: user.profileImage,
          rating: user.rating,

          skillsOffered: user.skillsOffered,

          skillsWanted: user.skillsWanted,

          matchedSkills,

          matchPercentage

        });

      }

    });

    const q = normalize(req.query.q);
    const minMatch = Number(req.query.minMatch ?? 0);
    const offeredAny = parseCsv(req.query.offeredAny).map(normalize);
    const wantedAny = parseCsv(req.query.wantedAny).map(normalize);
    const sort = normalize(req.query.sort || "best");

    let filtered = matches.filter((m) => {
      if (Number.isFinite(minMatch) && minMatch > 0 && m.matchPercentage < minMatch) {
        return false;
      }

      if (q) {
        const haystack = [
          m.name,
          m.bio,
          ...(m.skillsOffered || []),
          ...(m.skillsWanted || []),
          ...(m.matchedSkills || [])
        ]
          .map(normalize)
          .join(" ");

        if (!haystack.includes(q)) return false;
      }

      if (offeredAny.length > 0) {
        const offeredSet = new Set((m.skillsOffered || []).map(normalize));
        const ok = offeredAny.some((s) => offeredSet.has(s));
        if (!ok) return false;
      }

      if (wantedAny.length > 0) {
        const wantedSet = new Set((m.skillsWanted || []).map(normalize));
        const ok = wantedAny.some((s) => wantedSet.has(s));
        if (!ok) return false;
      }

      return true;
    });

    if (sort === "name") {
      filtered = filtered.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));
    } else if (sort === "newest") {
      // user._id is present; for now keep "best" unless we add createdAt to payload
      filtered = filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    } else {
      // best
      filtered = filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    }

    res.json({

      matches: filtered,
      total: filtered.length

    });

  } catch (error) {

    res.status(500).json({

      message: error.message

    });

  }

};
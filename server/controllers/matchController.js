const User = require("../models/user");
const {
  ensureUserEmbeddings,
  computeSwapScore,
  findExactMatches,
  findSemanticSkillMatches,
  scoreToPercentage,
  isEmbeddingAvailable,
} = require("../services/embeddingService");

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const buildMatchPayload = (user, currentUser, semanticScore) => {
  const exactMatchedSkills = findExactMatches(
    currentUser.skillsWanted,
    user.skillsOffered
  );

  const semanticMatches = findSemanticSkillMatches(
    currentUser.skillsWantedVectors,
    user.skillsOfferedVectors
  );

  const exactPercentage =
    currentUser.skillsWanted?.length > 0
      ? Math.round((exactMatchedSkills.length / currentUser.skillsWanted.length) * 100)
      : 0;

  const semanticPercentage = scoreToPercentage(semanticScore);

  const matchPercentage = semanticScore !== null
    ? Math.round(semanticPercentage * 0.65 + exactPercentage * 0.35)
    : exactPercentage;

  return {
    _id: user._id,
    name: user.name,
    bio: user.bio,
    profileImage: user.profileImage,
    rating: user.rating,
    skillsOffered: user.skillsOffered,
    skillsWanted: user.skillsWanted,
    matchedSkills: exactMatchedSkills,
    semanticMatches,
    matchPercentage,
    semanticScore: semanticPercentage,
    exactMatchPercentage: exactPercentage,
    recommendationType: semanticScore !== null ? "semantic" : "exact",
  };
};

// GET MATCHES
exports.getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
    });

    const useSemantic = isEmbeddingAvailable();
    let currentWithEmbeddings = currentUser;

    if (useSemantic) {
      currentWithEmbeddings = await ensureUserEmbeddings(currentUser);
    }

    const matches = [];

    for (const user of users) {
      let candidate = user;

      if (useSemantic) {
        candidate = await ensureUserEmbeddings(user);
      }

      const semanticScore = useSemantic
        ? computeSwapScore(currentWithEmbeddings, candidate)
        : null;

      const payload = buildMatchPayload(user, currentWithEmbeddings, semanticScore);

      const hasExactMatch = payload.matchedSkills.length > 0;
      const hasSemanticMatch =
        semanticScore !== null && semanticScore >= 0.55;
      const hasSemanticSkillPairs = payload.semanticMatches.length > 0;

      if (hasExactMatch || hasSemanticMatch || hasSemanticSkillPairs) {
        matches.push(payload);
      }
    }

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
          ...(m.matchedSkills || []),
          ...(m.semanticMatches || []).flatMap((pair) => [pair.wanted, pair.offered]),
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
    } else if (sort === "semantic") {
      filtered = filtered.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0));
    } else {
      filtered = filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    }

    res.json({
      matches: filtered,
      total: filtered.length,
      recommendationEngine: useSemantic ? "semantic-ai" : "exact-match",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

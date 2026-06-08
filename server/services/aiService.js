const {
  ensureUserEmbeddings,
  computeSwapScore,
  findSemanticSkillMatches,
  findExactMatches,
  scoreToPercentage,
  isEmbeddingAvailable,
} = require("./embeddingService");


exports.recommendMatches = async (users, currentUser) => {
  if (!isEmbeddingAvailable()) {
    return {
      engine: "exact-match",
      recommendations: [],
      message: "OPENAI_API_KEY is not configured. Semantic recommendations are disabled.",
    };
  }

  const currentWithEmbeddings = await ensureUserEmbeddings(currentUser);
  const recommendations = [];

  for (const user of users) {
    const candidate = await ensureUserEmbeddings(user);
    const semanticScore = computeSwapScore(currentWithEmbeddings, candidate);

    if (semanticScore === null || semanticScore < 0.55) {
      continue;
    }

    recommendations.push({
      userId: user._id,
      name: user.name,
      semanticScore: scoreToPercentage(semanticScore),
      exactMatches: findExactMatches(currentUser.skillsWanted, user.skillsOffered),
      semanticMatches: findSemanticSkillMatches(
        currentWithEmbeddings.skillsWantedVectors,
        candidate.skillsOfferedVectors
      ),
    });
  }

  recommendations.sort((a, b) => b.semanticScore - a.semanticScore);

  return {
    engine: "semantic-ai",
    model: "text-embedding-3-small",
    recommendations: recommendations.slice(0, 10),
  };
};

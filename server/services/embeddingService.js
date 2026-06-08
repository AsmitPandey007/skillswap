const OpenAI = require("openai");
const User = require("../models/user");
const { cosineSimilarity } = require("../utils/vector");

const EMBEDDING_MODEL = "text-embedding-3-small";
const SEMANTIC_SKILL_THRESHOLD = 0.72;

let openai = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function buildOfferedText(user) {
  const skills = (user.skillsOffered || []).filter(Boolean).join(", ");
  const bio = String(user.bio || "").trim();
  if (!skills && !bio) {
    return "";
  }
  return `Skills offered: ${skills || "none"}. ${bio}`.trim();
}

function buildWantedText(user) {
  const skills = (user.skillsWanted || []).filter(Boolean).join(", ");
  if (!skills) {
    return "";
  }
  return `Skills wanted: ${skills}.`;
}

async function embedTexts(texts) {
  const client = getClient();
  const cleaned = texts.map((t) => String(t || "").trim()).filter(Boolean);

  if (!client || cleaned.length === 0) {
    return [];
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
  });

  return response.data.map((item) => item.embedding);
}

async function embedSkillList(skills) {
  const list = (skills || []).map((s) => String(s).trim()).filter(Boolean);
  if (list.length === 0) {
    return [];
  }

  const vectors = await embedTexts(list);
  return list.map((skill, index) => ({
    skill,
    vector: vectors[index],
  }));
}

async function buildUserEmbeddings(user) {
  if (!getClient()) {
    return null;
  }

  try {
    const offeredText = buildOfferedText(user);
    const wantedText = buildWantedText(user);

    const [profileVectors, offeredSkillVectors, wantedSkillVectors] = await Promise.all([
      embedTexts([offeredText, wantedText].filter(Boolean)),
      embedSkillList(user.skillsOffered),
      embedSkillList(user.skillsWanted),
    ]);

    let offeredIdx = 0;
    let wantedIdx = 0;

    const skillsOfferedEmbedding = offeredText ? profileVectors[offeredIdx++] : [];
    const skillsWantedEmbedding = wantedText
      ? profileVectors[offeredText ? offeredIdx : wantedIdx++]
      : [];

    return {
      skillsOfferedEmbedding,
      skillsWantedEmbedding,
      skillsOfferedVectors: offeredSkillVectors,
      skillsWantedVectors: wantedSkillVectors,
      embeddingUpdatedAt: new Date(),
    };
  } catch (error) {
    console.error("Failed to generate embeddings:", error.message);
    return null;
  }
}

async function ensureUserEmbeddings(userDoc) {
  if (!getClient()) {
    return userDoc;
  }

  const hasProfileEmbeddings =
    userDoc.skillsOfferedEmbedding?.length > 0 || userDoc.skillsWantedEmbedding?.length > 0;

  const skillCount =
    (userDoc.skillsOffered?.length || 0) + (userDoc.skillsWanted?.length || 0);
  const vectorCount =
    (userDoc.skillsOfferedVectors?.length || 0) + (userDoc.skillsWantedVectors?.length || 0);

  if (hasProfileEmbeddings && vectorCount >= skillCount) {
    return userDoc;
  }

  try {
    const embeddings = await buildUserEmbeddings(userDoc);

    const updated = await User.findByIdAndUpdate(
      userDoc._id,
      embeddings,
      { new: true }
    );

    return updated || userDoc;
  } catch (error) {
    console.error("Failed to generate embeddings:", error.message);
    return userDoc;
  }
}

function computeSwapScore(currentUser, otherUser) {
  const offerFit = cosineSimilarity(
    currentUser.skillsWantedEmbedding,
    otherUser.skillsOfferedEmbedding
  );
  const wantFit = cosineSimilarity(
    currentUser.skillsOfferedEmbedding,
    otherUser.skillsWantedEmbedding
  );

  if (offerFit === null && wantFit === null) {
    return null;
  }
  if (offerFit === null) {
    return wantFit;
  }
  if (wantFit === null) {
    return offerFit;
  }

  return (offerFit + wantFit) / 2;
}

function findExactMatches(wantedSkills, offeredSkills) {
  const offeredSet = new Set((offeredSkills || []).map((s) => s.toLowerCase().trim()));
  return (wantedSkills || []).filter((skill) => offeredSet.has(skill.toLowerCase().trim()));
}

function findSemanticSkillMatches(wantedVectors, offeredVectors) {
  const matches = [];

  for (const wanted of wantedVectors || []) {
    for (const offered of offeredVectors || []) {
      const similarity = cosineSimilarity(wanted.vector, offered.vector);
      if (similarity === null || similarity < SEMANTIC_SKILL_THRESHOLD) {
        continue;
      }

      const sameSkill =
        wanted.skill.toLowerCase().trim() === offered.skill.toLowerCase().trim();
      if (sameSkill) {
        continue;
      }

      matches.push({
        wanted: wanted.skill,
        offered: offered.skill,
        similarity: Math.round(similarity * 100),
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

function scoreToPercentage(score) {
  if (score === null || score === undefined) {
    return 0;
  }
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

module.exports = {
  EMBEDDING_MODEL,
  SEMANTIC_SKILL_THRESHOLD,
  buildOfferedText,
  buildWantedText,
  buildUserEmbeddings,
  ensureUserEmbeddings,
  computeSwapScore,
  findExactMatches,
  findSemanticSkillMatches,
  scoreToPercentage,
  isEmbeddingAvailable: () => Boolean(getClient()),
};

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const AVAILABILITY_OPTIONS = ["weekdays", "weekends", "mornings", "evenings", "flexible"];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const skillLevelIndex = (level) => {
  const idx = SKILL_LEVELS.indexOf(normalize(level));
  return idx === -1 ? null : idx;
};

function overlapScore(a = [], b = []) {
  const setA = new Set(a.map(normalize).filter(Boolean));
  const setB = new Set(b.map(normalize).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      shared += 1;
    }
  }
  return shared / Math.max(setA.size, setB.size);
}

function locationScore(currentLocation, candidateLocation) {
  const a = normalize(currentLocation);
  const b = normalize(candidateLocation);
  if (!a || !b) {
    return 0;
  }
  if (a === b) {
    return 1;
  }
  if (a.includes(b) || b.includes(a)) {
    return 0.85;
  }
  return 0;
}

function skillLevelScore(currentLevel, candidateLevel) {
  const a = skillLevelIndex(currentLevel);
  const b = skillLevelIndex(candidateLevel);
  if (a === null || b === null) {
    return 0;
  }
  const distance = Math.abs(a - b);
  if (distance === 0) {
    return 1;
  }
  if (distance === 1) {
    return 0.75;
  }
  if (distance === 2) {
    return 0.45;
  }
  return 0.2;
}

function computeProfileFit(currentUser, candidate) {
  const location = locationScore(currentUser.location, candidate.location);
  const language = overlapScore(currentUser.languages, candidate.languages);
  const availability = overlapScore(currentUser.availability, candidate.availability);
  const skillLevel = skillLevelScore(currentUser.skillLevel, candidate.skillLevel);

  const parts = [location, language, availability, skillLevel].filter((score) => score > 0);
  if (parts.length === 0) {
    return 0;
  }

  return parts.reduce((sum, score) => sum + score, 0) / parts.length;
}

function computeHybridPercentage(skillMatchPercentage, profileFit) {
  const skill = Math.max(0, Math.min(100, skillMatchPercentage || 0));
  const profile = Math.round(Math.max(0, Math.min(1, profileFit || 0)) * 100);
  return Math.round(skill * 0.75 + profile * 0.25);
}

function passesHybridFilters(match, filters) {
  if (filters.location) {
    const needle = normalize(filters.location);
    const haystack = normalize(match.location);
    if (!haystack.includes(needle)) {
      return false;
    }
  }

  if (filters.skillLevel && normalize(filters.skillLevel) !== "any") {
    if (normalize(match.skillLevel) !== normalize(filters.skillLevel)) {
      return false;
    }
  }

  if (filters.availability) {
    const wanted = parseCsv(filters.availability).map(normalize);
    const theirs = (match.availability || []).map(normalize);
    const ok = wanted.some((slot) => theirs.includes(slot));
    if (!ok) {
      return false;
    }
  }

  if (filters.language) {
    const wanted = parseCsv(filters.language).map(normalize);
    const theirs = (match.languages || []).map(normalize);
    const ok = wanted.some((lang) => theirs.includes(lang));
    if (!ok) {
      return false;
    }
  }

  return true;
}

module.exports = {
  SKILL_LEVELS,
  AVAILABILITY_OPTIONS,
  normalize,
  parseCsv,
  computeProfileFit,
  computeHybridPercentage,
  passesHybridFilters,
};

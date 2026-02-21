/**
 * Normalize a string for comparison.
 * Handles German keyboard apostrophes, umlauts, punctuation, and whitespace.
 */
export function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[´`ʼʻ'']/g, "'")
    .replace(/[!.,?;:'"()/\-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .trim();
}

/**
 * Levenshtein distance for typo tolerance.
 */
export function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
  return dp[m][n];
}

/**
 * Fuzzy match: allows 1 typo for short words, 2 for longer.
 */
export function isFuzzyMatch(input, target) {
  const a = normalize(input);
  const b = normalize(target);
  if (a === b) return true;
  const maxDist = b.length <= 6 ? 1 : 2;
  return levenshtein(a, b) <= maxDist;
}

/**
 * Check an answer against a correct answer and alternatives.
 * Handles apostrophe variants and optional "to" prefix for verbs.
 */
export function checkAnswer(input, correct, alts = []) {
  if (isFuzzyMatch(input, correct)) return true;
  for (const a of alts) {
    if (isFuzzyMatch(input, a)) return true;
  }
  if (isFuzzyMatch(input, correct.replace("'s", "'"))) return true;
  const n = normalize(input);
  if (n.startsWith("to ") && isFuzzyMatch(n.slice(3), normalize(correct)))
    return true;
  if (!n.startsWith("to ") && isFuzzyMatch("to " + n, normalize(correct)))
    return true;
  return false;
}

/**
 * Special vocab check: checks primary + all alt answers for both directions.
 */
export function checkVocabAnswer(input, card) {
  const direction = card.direction;
  if (direction === "de2en") {
    const targets = [card.en, ...(card.altEn || [])];
    for (const t of targets) {
      if (isFuzzyMatch(input, t)) return true;
    }
    const n = normalize(input);
    for (const t of targets) {
      const nt = normalize(t);
      if (nt.startsWith("to ") && isFuzzyMatch(n, nt.slice(3))) return true;
      if (!nt.startsWith("to ") && isFuzzyMatch("to " + n, nt)) return true;
    }
  } else {
    const targets = [card.de, ...(card.altDe || [])];
    for (const t of targets) {
      if (isFuzzyMatch(input, t)) return true;
    }
  }
  return false;
}

/**
 * Fisher-Yates shuffle.
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

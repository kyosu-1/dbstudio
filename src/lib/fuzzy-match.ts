export interface FuzzyResult {
  score: number;
  matches: number[];
}

export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  const matches: number[] = [];

  let qi = 0;
  for (let ti = 0; ti < targetLower.length && qi < queryLower.length; ti++) {
    if (targetLower[ti] === queryLower[qi]) {
      matches.push(ti);
      qi++;
    }
  }

  if (qi < queryLower.length) return null;

  let score = 0;
  for (let i = 0; i < matches.length; i++) {
    if (i > 0 && matches[i] === matches[i - 1] + 1) {
      score += 3;
    }
    if (matches[i] === 0 || /\W/.test(target[matches[i] - 1])) {
      score += 2;
    }
    score += Math.max(0, 10 - matches[i]);
  }

  return { score, matches };
}

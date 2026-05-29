export type FuzzyMatchResult = {
  /** Indices in the target string that matched the query, in order. */
  indices: number[]
  /** Higher is a better match. */
  score: number
}

const START_BONUS = 12
const WORD_BOUNDARY_BONUS = 10
const CONSECUTIVE_BONUS = 8
const GAP_PENALTY = 1

const isWordChar = (char: string | undefined): boolean => Boolean(char) && /[a-z0-9]/i.test(char)

/**
 * Case-insensitive fuzzy subsequence match. Returns `null` when `query` is not a
 * subsequence of `target`. Score rewards matches at the start of the string, at
 * word boundaries, and consecutive runs; it penalizes gaps between matches.
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatchResult | null {
  if (!query) {
    return { indices: [], score: 0 }
  }

  const q = query.toLowerCase()
  const t = target.toLowerCase()
  const indices: number[] = []

  let score = 0
  let queryIndex = 0
  let prevMatchIndex = -1

  for (let targetIndex = 0; targetIndex < t.length && queryIndex < q.length; targetIndex++) {
    if (t[targetIndex] !== q[queryIndex]) {
      continue
    }

    indices.push(targetIndex)

    if (targetIndex === 0) {
      score += START_BONUS
    } else if (!isWordChar(target[targetIndex - 1])) {
      score += WORD_BOUNDARY_BONUS
    }

    if (prevMatchIndex === targetIndex - 1) {
      score += CONSECUTIVE_BONUS
    } else if (prevMatchIndex !== -1) {
      score -= (targetIndex - prevMatchIndex - 1) * GAP_PENALTY
    }

    prevMatchIndex = targetIndex
    queryIndex++
  }

  if (queryIndex < q.length) {
    return null
  }

  return { indices, score }
}

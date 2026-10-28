const WORD_SPLIT_REGEX = /[^\p{L}\p{N}]+/u

/**
 * Matches a label against a search query. Single-character queries only match
 * the start of a word, keeping single-letter searches low-noise; queries of two
 * or more characters match anywhere in the label.
 *
 * Shared by every in-popup search so they all filter alike.
 */
export function matchesSearchQuery({ label, query }: { label: string; query: string }): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const normalizedLabel = label.toLowerCase()

  if (normalizedQuery.length === 1) {
    return normalizedLabel.split(WORD_SPLIT_REGEX).some((word) => word.startsWith(normalizedQuery))
  }

  return normalizedLabel.includes(normalizedQuery)
}

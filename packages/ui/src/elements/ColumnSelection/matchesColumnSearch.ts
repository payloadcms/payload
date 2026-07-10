const WORD_SPLIT_REGEX = /[^a-z0-9]+/i

/**
 * Matches a column label against a search query. Single-character queries only
 * match the start of a word, keeping single-letter searches low-noise; queries
 * of two or more characters match anywhere in the label.
 */
export function matchesColumnSearch({
  labelText,
  query,
}: {
  labelText: string
  query: string
}): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const normalizedLabel = labelText.toLowerCase()

  if (normalizedQuery.length === 1) {
    return normalizedLabel.split(WORD_SPLIT_REGEX).some((word) => word.startsWith(normalizedQuery))
  }

  return normalizedLabel.includes(normalizedQuery)
}

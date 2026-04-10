/**
 * Format date to <month|short> <day|numeric>, <year|numeric>
 */
export function formattedDate(createdAt: string): string {
  const date = new Date(createdAt)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get days ago in YYYY-MM-DD format
 */
export function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

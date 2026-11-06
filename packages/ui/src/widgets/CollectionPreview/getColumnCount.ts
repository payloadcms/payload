/** Prefer the greatest number of columns that fit at the minimum card width. */
export function getColumnCount({
  gap = 24,
  limit = 8,
  minWidth = 180,
  width,
}: {
  gap?: number
  limit?: number
  minWidth?: number
  width: number
}): number {
  return Math.max(1, Math.min(limit, Math.floor((width + gap) / (minWidth + gap))))
}

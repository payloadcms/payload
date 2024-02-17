export function isNumber(value: unknown): value is number {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return false
  }

  return !Number.isNaN(Number(value))
}

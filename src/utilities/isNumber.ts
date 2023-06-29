export function isNumber(value: unknown): boolean {
  if (typeof value === 'string' && value.trim() === ''){
    return false
  }

  return !Number.isNaN(Number(value));
}
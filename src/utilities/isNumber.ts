export function isNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim() !== '' && !Number.isNaN(Number(value));
  }
  return !Number.isNaN(Number(value));
}
export function isNumber(value: unknown): boolean {
  return !Number.isNaN(Number(value));
}

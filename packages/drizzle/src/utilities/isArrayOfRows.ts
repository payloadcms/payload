export function isArrayOfRows(data: unknown): data is Record<string, unknown>[] {
  return Array.isArray(data)
}

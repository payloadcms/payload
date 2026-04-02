export function searchParamsToRecord(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search)
  const result: Record<string, string | string[]> = {}

  for (const [key, value] of params.entries()) {
    const existingValue = result[key]

    if (existingValue === undefined) {
      result[key] = value
      continue
    }

    if (Array.isArray(existingValue)) {
      existingValue.push(value)
      continue
    }

    result[key] = [existingValue, value]
  }

  return result
}

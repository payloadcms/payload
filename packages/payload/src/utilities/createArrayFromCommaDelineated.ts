export function createArrayFromCommaDelineated(input: string): string[] {
  if (Array.isArray(input)) {
    return input
  }
  if (input.indexOf(',') > -1) {
    return input.split(',')
  }
  return [input]
}

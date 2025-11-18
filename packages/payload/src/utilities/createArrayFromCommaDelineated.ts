export function createArrayFromCommaDelineated(input: string): string[] {
  if (Array.isArray(input)) {
    return input
  }

  return input.split(',')
}

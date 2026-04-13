export function isValidStringID(value: string) {
  return /^[\w-]+$/.test(value)
}

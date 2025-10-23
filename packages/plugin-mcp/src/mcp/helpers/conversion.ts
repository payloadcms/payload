export const toCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

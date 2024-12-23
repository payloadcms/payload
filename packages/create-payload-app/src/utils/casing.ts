export const toCamelCase = (str: string) => {
  const s = str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g)
    ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join('')
  return (s && s.slice(0, 1).toLowerCase() + s.slice(1)) ?? ''
}

export function toPascalCase(input: string): string {
  return input
    .replace(/[_-]+/g, ' ') // Replace underscores or hyphens with spaces
    .replace(/(?:^|\s+)(\w)/g, (_, c) => c.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, '') // Remove all spaces
}

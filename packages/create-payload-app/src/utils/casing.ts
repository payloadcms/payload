export function toCamelCase(str: string) {
  return str
    .replace(/^\w|[A-Z]|\b\w/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

export function toPascalCase(input: string): string {
  return input
    .replace(/[_-]+/g, ' ') // Replace underscores or hyphens with spaces
    .replace(/(?:^|\s+)(\w)/g, (_, c) => c.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, '') // Remove all spaces
}

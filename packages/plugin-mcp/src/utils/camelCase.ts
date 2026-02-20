/**
 * Converts a string to camel case by replacing dashes, underscores, and spaces
 * with camel case formatting.
 *
 * @param str - The string to convert to camel case
 * @returns The camel cased string
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^(.)/, (_, chr) => chr.toLowerCase())
}

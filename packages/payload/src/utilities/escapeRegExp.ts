/**
 * Escapes special characters in a string for use in a regular expression
 * @param string - The string to escape
 * @returns The escaped string safe for use in RegExp
 */
export const escapeRegExp = (string: string): string =>
  string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')

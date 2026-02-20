import { formatUtcOffset } from './formatUtcOffset.js'

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export const formatName = (string: string): string => {
  let sanitizedString = String(string)

  // Check if this is a UTC offset (e.g., +05:30, -08:00)
  // These need special handling to avoid collisions
  const utcOffsetName = formatUtcOffset(sanitizedString)
  if (utcOffsetName) {
    return utcOffsetName
  }

  const firstLetter = sanitizedString.substring(0, 1)

  if (numbers.indexOf(firstLetter) > -1) {
    sanitizedString = `_${sanitizedString}`
  }

  const formatted = sanitizedString
    // Convert accented characters
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

    .replace(/\./g, '_')
    .replace(/-|\//g, '_')
    .replace(/\+/g, '_')
    .replace(/,/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '_')
    .replace(/'/g, '_')
    .replace(/ /g, '')
    .replace(/\[|\]/g, '_')

  return formatted || '_'
}

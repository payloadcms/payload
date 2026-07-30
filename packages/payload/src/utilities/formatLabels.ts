import pluralize from 'pluralize'
const { isPlural, singular } = pluralize

const unicodeWhitespaceRegex = /\s/u

export const toWords = (inputString: string, joinWords = false): string => {
  const input = (inputString || '').trim()
  let capitalizeNext = true
  let result = ''

  for (let i = 0; i < input.length; i++) {
    const character = input[i]!
    const characterCode = input.charCodeAt(i)
    const isSeparator =
      characterCode === 45 ||
      characterCode <= 32 ||
      (characterCode > 127 && unicodeWhitespaceRegex.test(character))

    if (isSeparator) {
      if (!joinWords && result && result.charCodeAt(result.length - 1) !== 32) {
        result += ' '
      }
      capitalizeNext = true
      continue
    }

    const isUppercase = characterCode >= 65 && characterCode <= 90
    if (!joinWords && isUppercase && result && result.charCodeAt(result.length - 1) !== 32) {
      result += ' '
    }

    result += capitalizeNext ? character.toUpperCase() : character
    capitalizeNext = false
  }

  return !joinWords && result.charCodeAt(result.length - 1) === 32 ? result.slice(0, -1) : result
}

export const formatLabels = (slug: string): { plural: string; singular: string } => {
  const words = toWords(slug)

  return isPlural(slug)
    ? {
        plural: words,
        singular: singular(words),
      }
    : {
        plural: pluralize(words),
        singular: words,
      }
}

export const formatNames = (slug: string): { plural: string; singular: string } => {
  const words = toWords(slug, true)
  return isPlural(slug)
    ? {
        plural: words,
        singular: singular(words),
      }
    : {
        plural: pluralize(words),
        singular: words,
      }
}

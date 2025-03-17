// @ts-strict-ignore
import pluralize from 'pluralize'
const { isPlural, singular } = pluralize

const capitalizeFirstLetter = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1)

const toWords = (inputString: string, joinWords = false): string => {
  const notNullString = inputString || ''
  const trimmedString = notNullString.trim()
  const arrayOfStrings = trimmedString.split(/[\s-]/)

  const splitStringsArray = []
  arrayOfStrings.forEach((tempString) => {
    if (tempString !== '') {
      const splitWords = tempString.split(/(?=[A-Z])/).join(' ')
      splitStringsArray.push(capitalizeFirstLetter(splitWords))
    }
  })

  return joinWords ? splitStringsArray.join('').replace(/\s/g, '') : splitStringsArray.join(' ')
}

const formatLabels = (slug: string): { plural: string; singular: string } => {
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

const formatNames = (slug: string): { plural: string; singular: string } => {
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

export { formatLabels, formatNames, toWords }

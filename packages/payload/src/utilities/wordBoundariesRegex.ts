export default (input: string): RegExp => {
  const words = input.split(' ')

  // Regex word boundaries that work for cyrillic characters - https://stackoverflow.com/a/47062016/1717697
  const wordBoundaryBefore = '(?:(?:[^\\p{L}\\p{N}])|^)' // Converted to a non-matching group instead of positive lookbehind for Safari
  const wordBoundaryAfter = '(?=[^\\p{L}\\p{N}]|$)'
  const regex = words.reduce((pattern, word, i) => {
    const escapedWord = word.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
    return `${pattern}(?=.*${wordBoundaryBefore}.*${escapedWord}.*${wordBoundaryAfter})${
      i + 1 === words.length ? '.+' : ''
    }`
  }, '')
  return new RegExp(regex, 'i')
}

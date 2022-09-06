export default (input: string): RegExp => {
  const words = input.split(' ');

  // Regex word boundaries that work for cyrillic characters - https://stackoverflow.com/a/47062016/1717697
  const wordBoundaryBefore = '(?:(?<=[^\\p{L}\\p{N}])|^)';
  const wordBoundaryAfter = '(?=[^\\p{L}\\p{N}]|$)';

  const regex = words.reduce((pattern, word, i) => {
    return `${pattern}(?=.*${wordBoundaryBefore}${word}.*${wordBoundaryAfter})${i + 1 === words.length ? '.+' : ''}`;
  }, '');
  return new RegExp(regex, 'i');
};

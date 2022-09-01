export default (input: string): RegExp => {
  const words = input.split(' ');
  const regex = words.reduce((pattern, word, i) => {
    return `${pattern}(?=.*\\b${word}.*\\b)${i + 1 === words.length ? '.+' : ''}`;
  }, '');
  return new RegExp(regex, 'i');
};

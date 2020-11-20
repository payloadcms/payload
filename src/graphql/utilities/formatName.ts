const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const formatName = (string) => {
  let sanitizedString = String(string);

  const firstLetter = sanitizedString.substring(0, 1);

  if (numbers.indexOf(firstLetter) > -1) {
    sanitizedString = `_${sanitizedString}`;
  }

  const formatted = sanitizedString
    .replace(/\./g, '_')
    .replace(/-|\//g, '_')
    .replace(/\+/g, '_')
    .replace(/,/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '_')
    .replace(/'/g, '_')
    .replace(/ /g, '');

  return formatted;
};

export default formatName;

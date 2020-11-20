const pluralize = require('pluralize');

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const toWords = (inputString) => {
  const notNullString = inputString || '';
  const trimmedString = notNullString.trim();
  const arrayOfStrings = trimmedString.split(/[\s-]/);

  const splitStringsArray = [];
  arrayOfStrings.forEach((tempString) => {
    if (tempString !== '') {
      const splitWords = tempString.split(/(?=[A-Z])/).join(' ');
      splitStringsArray.push(capitalizeFirstLetter(splitWords));
    }
  });

  return splitStringsArray.join(' ');
};

const formatLabels = ((input) => {
  const words = toWords(input);
  return {
    singular: words,
    plural: pluralize(words),
  };
});

module.exports = formatLabels;

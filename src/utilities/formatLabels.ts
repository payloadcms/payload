import pluralize, { isPlural, singular } from 'pluralize';

const capitalizeFirstLetter = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1);

const toWords = (inputString: string, joinWords = false): string => {
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

  return joinWords
    ? splitStringsArray.join('').replace(/\s/gi, '')
    : splitStringsArray.join(' ');
};

const formatLabels = ((slug: string): { singular: string, plural: string } => {
  const words = toWords(slug);
  return (isPlural(slug))
    ? {
      singular: singular(words),
      plural: words,
    }
    : {
      singular: words,
      plural: pluralize(words),
    };
});

const formatNames = ((slug: string): { singular: string, plural: string } => {
  const words = toWords(slug, true);
  return (isPlural(slug))
    ? {
      singular: singular(words),
      plural: words,
    }
    : {
      singular: words,
      plural: pluralize(words),
    };
});

export {
  formatNames,
  formatLabels,
  toWords,
};

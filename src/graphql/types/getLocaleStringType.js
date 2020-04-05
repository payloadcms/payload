const { GraphQLScalarType } = require('graphql');
const getIsLocaleObject = require('../utilities/getIsLocaleObject');

module.exports = (localization) => {
  const coerceType = (value) => {
    const isLocaleObject = getIsLocaleObject(localization, value);

    if (typeof value === 'string'
      || isLocaleObject) {
      return value;
    }

    throw new Error('LocaleString can only represent a string or an object containing all locales.');
  };

  const LocaleString = new GraphQLScalarType({
    name: 'LocaleType',
    description: 'Handles locale values that can either be an object containing all locales or a string of a single locale.',
    serialize: coerceType,
    parseValue: coerceType,
    parseLiteral: ast => ast.value,
  });

  return LocaleString;
};

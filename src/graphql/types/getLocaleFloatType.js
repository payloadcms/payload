const { GraphQLScalarType } = require('graphql');
const getIsLocaleObject = require('../utilities/getIsLocaleObject');

module.exports = (localization) => {
  const coerceType = (value) => {
    const isLocaleObject = getIsLocaleObject(localization, value);

    if (typeof value === 'number'
      || isLocaleObject) {
      return value;
    }

    throw new Error('LocaleFloatType can only represent a float or an object containing all locales.');
  };

  const LocaleString = new GraphQLScalarType({
    name: 'LocaleType',
    description: 'Handles locale values that can either be an object containing all locales or a float of a single locale.',
    serialize: coerceType,
    parseValue: coerceType,
    parseLiteral: ast => ast.value,
  });

  return LocaleString;
};

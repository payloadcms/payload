const { GraphQLScalarType } = require('graphql');

module.exports = (context) => {
  const coerceType = (value) => {
    const isLocaleObject = context.checkIfLocaleObject(value);

    if (typeof value === 'string' || isLocaleObject) {
      return value;
    }

    throw new Error('LocaleString can only represent a string or an object containing all locales.');
  };

  const LocaleStringType = new GraphQLScalarType({
    name: 'LocaleStringType',
    description: 'Handles locale values that can either be an object containing all locales or a string of a single locale.',
    serialize: coerceType,
    parseValue: coerceType,
    parseLiteral: ast => ast.value,
  });

  return LocaleStringType;
};

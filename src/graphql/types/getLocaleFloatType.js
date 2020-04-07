const { GraphQLScalarType } = require('graphql');

module.exports = (context) => {
  const coerceType = (value) => {
    const isLocaleObject = context.checkIfLocaleObject(value);

    if (typeof value === 'number' || isLocaleObject) {
      return value;
    }

    throw new Error('LocaleFloatType can only represent a float or an object containing all locales.');
  };

  const LocaleFloatType = new GraphQLScalarType({
    name: 'LocaleFloatType',
    description: 'Handles locale values that can either be an object containing all locales or a float of a single locale.',
    serialize: coerceType,
    parseValue: coerceType,
    parseLiteral: ast => ast.value,
  });

  return LocaleFloatType;
};

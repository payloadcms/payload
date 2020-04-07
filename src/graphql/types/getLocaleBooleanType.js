const { GraphQLScalarType } = require('graphql');

module.exports = (context) => {
  const coerceType = (value) => {
    const isLocaleObject = context.checkIfLocaleObject(value);

    if (typeof value === 'boolean' || isLocaleObject) {
      return value;
    }

    throw new Error('LocaleBooleanType can only represent a boolean or an object containing all locales.');
  };

  const LocaleBooleanType = new GraphQLScalarType({
    name: 'LocaleBooleanType',
    description: 'Handles locale values that can either be an object containing all locales or a boolean of a single locale.',
    serialize: coerceType,
    parseValue: coerceType,
    parseLiteral: ast => ast.value,
  });

  return LocaleBooleanType;
};

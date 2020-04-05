const { GraphQLScalarType } = require('graphql');
const getIsLocaleObject = require('../utilities/getIsLocaleObject');
const combineParentName = require('../utilities/combineParentName');

module.exports = (config) => {
  return (field, type, parent) => {
    const fullName = combineParentName(parent, field.label);

    const coerceType = (value) => {
      const isLocaleObject = getIsLocaleObject(config, value);

      if (value instanceof type || isLocaleObject) {
        return value;
      }

      throw new Error(`LocaleFloatType can only represent an object containing locales or ${fullName} properties.`);
    };

    const LocaleObjectType = new GraphQLScalarType({
      name: `${fullName}LocaleType`,
      description: `Handles locale values that can either be an object containing all locales or an object containing ${fullName} properties.`,
      serialize: coerceType,
      parseValue: coerceType,
      parseLiteral: ast => ast.value,
    });

    return LocaleObjectType;
  };
};

const { GraphQLScalarType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

module.exports = (context) => {
  return (field, type, parent) => {
    const fullName = combineParentName(parent, field.label);

    const coerceType = (value) => {
      const isLocaleObject = context.checkIfLocaleObject(value);

      if (isLocaleObject) {
        // const allKeysValid = Object.values(value).every(locale => isValidJSValue(locale, type));

        // if (allKeysValid) {
        return value;
        // }
      }

      return value;

      // throw new Error(`${fullName}LocaleType can only represent an object containing locales or a matchiing ${fullName} type.`);
    };

    const LocaleCustomType = new GraphQLScalarType({
      name: `${fullName}LocaleType`,
      description: `Handles locale values that can either be an object containing locales or a matching ${fullName} type.`,
      serialize: coerceType,
      parseValue: coerceType,
      parseLiteral: ast => ast.value,
    });

    return LocaleCustomType;
  };
};

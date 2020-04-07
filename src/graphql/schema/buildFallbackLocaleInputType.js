const { GraphQLEnumType } = require('graphql');

const buildFallbackLocaleInputType = (localization) => {
  return new GraphQLEnumType({
    name: 'FallbackLocaleInputType',
    values: [...localization.locales, 'none'].reduce((values, locale) => ({
      ...values,
      [locale]: {
        value: locale,
      },
    }), {}),
  });
};

module.exports = buildFallbackLocaleInputType;

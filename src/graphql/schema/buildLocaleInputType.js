const { GraphQLEnumType } = require('graphql');

const buildLocaleInputType = (localization) => {
  return new GraphQLEnumType({
    name: 'LocaleInputType',
    values: localization.locales.reduce((values, locale) => ({
      ...values,
      [locale]: {
        value: locale,
      },
    }), {}),
  });
};

module.exports = buildLocaleInputType;

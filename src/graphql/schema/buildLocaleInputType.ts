import { GraphQLEnumType } from 'graphql';

const buildLocaleInputType = (localization) => new GraphQLEnumType({
  name: 'LocaleInputType',
  values: localization.locales.reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildLocaleInputType;

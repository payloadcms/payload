import { GraphQLEnumType } from 'graphql';
import { Config } from 'src/config/types';

const buildLocaleInputType = (localization: Config['localization']): GraphQLEnumType => new GraphQLEnumType({
  name: 'LocaleInputType',
  values: localization.locales.reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildLocaleInputType;

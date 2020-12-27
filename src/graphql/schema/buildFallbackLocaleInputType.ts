import { GraphQLEnumType } from 'graphql';
import { Config } from '../../config/types';

const buildFallbackLocaleInputType = (localization: Config['localization']): GraphQLEnumType => new GraphQLEnumType({
  name: 'FallbackLocaleInputType',
  values: [...localization.locales, 'none'].reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildFallbackLocaleInputType;

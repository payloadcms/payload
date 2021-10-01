import { GraphQLEnumType } from 'graphql';
import { SanitizedConfig } from '../../config/types';

const buildFallbackLocaleInputType = (localization: SanitizedConfig['localization']): GraphQLEnumType => new GraphQLEnumType({
  name: 'FallbackLocaleInputType',
  values: [...localization.locales, 'none'].reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildFallbackLocaleInputType;

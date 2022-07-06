import { GraphQLEnumType } from 'graphql';
import { LocalizationConfig } from '../../config/types';

const buildFallbackLocaleInputType = (localization: LocalizationConfig): GraphQLEnumType => new GraphQLEnumType({
  name: 'FallbackLocaleInputType',
  values: [...localization.locales, 'none'].reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildFallbackLocaleInputType;

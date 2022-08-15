import { GraphQLEnumType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
import formatName from '../utilities/formatName';

const buildFallbackLocaleInputType = (localization: LocalizationConfig): GraphQLEnumType => new GraphQLEnumType({
  name: 'FallbackLocaleInputType',
  values: [...localization.locales, 'none'].reduce((values, locale) => ({
    ...values,
    [formatName(locale)]: {
      value: locale,
    },
  }), {}),
});

export default buildFallbackLocaleInputType;

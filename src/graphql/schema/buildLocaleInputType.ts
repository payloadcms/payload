import { GraphQLEnumType } from 'graphql';
import { LocalizationConfig } from '../../config/types';

const buildLocaleInputType = (localization: LocalizationConfig): GraphQLEnumType => new GraphQLEnumType({
  name: 'LocaleInputType',
  values: localization.locales.reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildLocaleInputType;

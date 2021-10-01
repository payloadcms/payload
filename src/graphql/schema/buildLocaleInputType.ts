import { GraphQLEnumType } from 'graphql';
import { SanitizedConfig } from '../../config/types';

const buildLocaleInputType = (localization: SanitizedConfig['localization']): GraphQLEnumType => new GraphQLEnumType({
  name: 'LocaleInputType',
  values: localization.locales.reduce((values, locale) => ({
    ...values,
    [locale]: {
      value: locale,
    },
  }), {}),
});

export default buildLocaleInputType;

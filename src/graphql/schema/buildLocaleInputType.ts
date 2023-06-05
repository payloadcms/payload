import { GraphQLEnumType, GraphQLScalarType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
import formatName from '../utilities/formatName';
import unifiedLocaleConfig from '../../utilities/unifiedLocaleConfig';

const buildLocaleInputType = (
  localization_: LocalizationConfig,
): GraphQLEnumType | GraphQLScalarType => {
  const localization = unifiedLocaleConfig(localization_);
  return new GraphQLEnumType({
    name: 'LocaleInputType',
    values: localization.locales.reduce(
      (values, locale) => ({
        ...values,
        [formatName(locale)]: {
          value: locale,
        },
      }),
      {},
    ),
  });
};

export default buildLocaleInputType;

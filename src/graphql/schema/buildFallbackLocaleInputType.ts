import { GraphQLEnumType } from 'graphql';
import { LocalizationConfig } from '../../config/types';
import formatName from '../utilities/formatName';
import unifiedLocaleConfig from '../../utilities/unifiedLocaleConfig';

const buildFallbackLocaleInputType = (
  localization_: LocalizationConfig,
): GraphQLEnumType => {
  const localization = unifiedLocaleConfig(localization_);
  return new GraphQLEnumType({
    name: 'FallbackLocaleInputType',
    values: [...localization.locales, 'none'].reduce(
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

export default buildFallbackLocaleInputType;

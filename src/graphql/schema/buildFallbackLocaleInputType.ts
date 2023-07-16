import { GraphQLEnumType } from 'graphql';
import { SanitizedLocalizationConfig } from '../../config/types';
import formatName from '../utilities/formatName';

const buildFallbackLocaleInputType = (
  localization: SanitizedLocalizationConfig,
): GraphQLEnumType => {
  return new GraphQLEnumType({
    name: 'FallbackLocaleInputType',
    values: [...localization.localesSimple, 'none'].reduce(
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

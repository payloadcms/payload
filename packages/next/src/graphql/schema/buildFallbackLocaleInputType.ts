import { GraphQLEnumType } from 'graphql'

import type { SanitizedLocalizationConfig } from 'payload/config'

import formatName from '../utilities/formatName'

const buildFallbackLocaleInputType = (
  localization: SanitizedLocalizationConfig,
): GraphQLEnumType => {
  return new GraphQLEnumType({
    name: 'FallbackLocaleInputType',
    values: [...localization.localeCodes, 'none'].reduce(
      (values, locale) => ({
        ...values,
        [formatName(locale)]: {
          value: locale,
        },
      }),
      {},
    ),
  })
}

export default buildFallbackLocaleInputType

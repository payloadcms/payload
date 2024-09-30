import type { GraphQLScalarType } from 'graphql'
import type { SanitizedLocalizationConfig } from 'payload'

import { GraphQLEnumType } from 'graphql'

import { formatName } from '../utilities/formatName.js'

export const buildLocaleInputType = (
  localization: SanitizedLocalizationConfig,
): GraphQLEnumType | GraphQLScalarType => {
  return new GraphQLEnumType({
    name: 'LocaleInputType',
    values: localization.localeCodes.reduce(
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

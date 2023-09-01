import type { GraphQLScalarType } from 'graphql'

import { GraphQLEnumType } from 'graphql'

import type { SanitizedLocalizationConfig } from '../../config/types'

import formatName from '../utilities/formatName'

const buildLocaleInputType = (
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

export default buildLocaleInputType

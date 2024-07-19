import type { GraphQLEnumValueConfig, ThunkObjMap } from 'graphql'
import type { Option } from 'payload'

import formatName from './formatName.js'

export function buildOptionEnums(options: Option[]): ThunkObjMap<GraphQLEnumValueConfig> {
  return options.reduce((values, option) => {
    if (typeof option === 'string') {
      return {
        ...values,
        [formatName(option)]: {
          value: option,
        },
      }
    } else if ('options' in option) {
      return {
        ...values,
        ...buildOptionEnums(option.options),
      }
    } else {
      return {
        ...values,
        [formatName(option.value)]: {
          value: option.value,
        },
      }
    }
  }, {})
}

import type { GraphQLEnumValueConfig, ThunkObjMap } from 'graphql'
import type { Option } from 'payload'

import formatName from './formatName.js'

export function buildOptionEnums(options: Option[]): ThunkObjMap<GraphQLEnumValueConfig> {
  return options.reduce((acc, option) => {
    if (typeof option === 'string') {
      acc[formatName(option)] = {
        value: option,
      }
    } else if ('options' in option) {
      acc = {
        ...acc,
        ...buildOptionEnums(option.options),
      }
    } else {
      acc[formatName(option.value)] = {
        value: option.value,
      }
    }
    return acc
  }, {})
}

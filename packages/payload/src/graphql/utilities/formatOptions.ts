import type { RadioField, SelectField } from '../../fields/config/types'

import { optionIsObject } from '../../fields/config/types'
import formatName from './formatName'

const formatOptions = (field: RadioField | SelectField) => {
  return field.options.reduce((values, option) => {
    if (optionIsObject(option)) {
      return {
        ...values,
        [formatName(option.value)]: {
          value: option.value,
        },
      }
    }

    return {
      ...values,
      [formatName(option)]: {
        value: option,
      },
    }
  }, {})
}

export default formatOptions

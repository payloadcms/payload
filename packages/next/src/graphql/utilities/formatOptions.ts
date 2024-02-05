import type { RadioField, SelectField } from 'payload/types'

import formatName from './formatName'

const formatOptions = (field: RadioField | SelectField) => {
  return field.options.reduce((values, option) => {
    if (typeof option === 'object') {
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

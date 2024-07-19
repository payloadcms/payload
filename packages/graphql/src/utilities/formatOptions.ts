import type { Option, RadioField, SelectField } from 'payload'

import formatName from './formatName.js'

const formatOptions = (field: RadioField | SelectField) => {
  const buildOptions = (options: Option[]) =>
    options.reduce((values, option) => {
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
          ...buildOptions(option.options),
        }
      }

      return {
        ...values,
        [formatName(option.value)]: {
          value: option.value,
        },
      }
    }, {})

  return buildOptions(field.options)
}

export default formatOptions

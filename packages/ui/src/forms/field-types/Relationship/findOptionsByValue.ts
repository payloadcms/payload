import type { Option } from '../../../elements/ReactSelect/types'
import type { OptionGroup, Value } from './types'

type Args = {
  options: OptionGroup[]
  value: Value | Value[]
}

export const findOptionsByValue = ({ options, value }: Args): Option | Option[] => {
  if (value) {
    if (Array.isArray(value)) {
      return value.map((val) => {
        let matchedOption: Option

        options.forEach((optGroup) => {
          if (!matchedOption) {
            matchedOption = optGroup.options.find((option) => {
              if (typeof val === 'object') {
                return option.value === val.value && option.relationTo === val.relationTo
              }

              return val === option.value
            })
          }
        })

        return matchedOption
      })
    }

    let matchedOption: Option

    options.forEach((optGroup) => {
      if (!matchedOption) {
        matchedOption = optGroup.options.find((option) => {
          if (typeof value === 'object') {
            return option.value === value.value && option.relationTo === value.relationTo
          }
          return value === option.value
        })
      }
    })

    return matchedOption
  }

  return undefined
}

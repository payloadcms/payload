'use client'
import type { Option } from '../../elements/ReactSelect/types.js'
import type { OptionGroup, Value } from './types.js'

type Args = {
  allowEdit: boolean
  allowOpenInNewTab: boolean
  options: OptionGroup[]
  value: Value | Value[]
}

export const findOptionsByValue = ({
  allowEdit,
  allowOpenInNewTab,
  options,
  value,
}: Args): Option | Option[] => {
  if (value || typeof value === 'number') {
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

        return matchedOption ? { allowEdit, allowOpenInNewTab, ...matchedOption } : undefined
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

    return matchedOption ? { allowEdit, allowOpenInNewTab, ...matchedOption } : undefined
  }

  return undefined
}

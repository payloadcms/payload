'use client'
import type { ValueWithRelation } from '@ruya.sa/payload'

import type { Option } from '../../elements/ReactSelect/types.js'
import type { OptionGroup } from './types.js'

type Args = {
  allowEdit: boolean
  options: OptionGroup[]
  value: ValueWithRelation | ValueWithRelation[]
}

export const findOptionsByValue = ({ allowEdit, options, value }: Args): Option | Option[] => {
  if (value || typeof value === 'number') {
    if (Array.isArray(value)) {
      return value.map((val) => {
        let matchedOption: Option

        options.forEach((optGroup) => {
          if (!matchedOption) {
            matchedOption = optGroup.options.find((option) => {
              return option.value === val.value && option.relationTo === val.relationTo
            })
          }
        })

        return matchedOption ? { allowEdit, ...matchedOption } : undefined
      })
    }

    let matchedOption: Option

    options.forEach((optGroup) => {
      if (!matchedOption) {
        matchedOption = optGroup.options.find((option) => {
          return option.value === value.value && option.relationTo === value.relationTo
        })
      }
    })

    return matchedOption ? { allowEdit, ...matchedOption } : undefined
  }

  return undefined
}

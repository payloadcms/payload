'use client'

import type { TextField } from 'payload/dist/fields/config/types'

import { Select, useForm } from 'payload/components/forms'
import React, { useEffect, useState } from 'react'

import type { SelectFieldOption } from '../../types'

export const DynamicFieldSelector: React.FC<TextField> = (props) => {
  const { fields, getDataByPath } = useForm()

  const [options, setOptions] = useState<SelectFieldOption[]>([])

  useEffect(() => {
    // @ts-ignore
    const fields: any[] = getDataByPath('fields')

    if (fields) {
      const allNonPaymentFields = fields
        .map((block): SelectFieldOption | null => {
          const { name, blockType, label } = block

          if (blockType !== 'payment') {
            return {
              label,
              value: name,
            }
          }

          return null
        })
        .filter(Boolean)
      setOptions(allNonPaymentFields)
    }
  }, [fields, getDataByPath])

  return <Select {...props} options={options} />
}

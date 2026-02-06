'use client'

import type { SelectFieldClientProps, SelectFieldValidation } from 'payload'

import { SelectField, useForm } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { SelectFieldOption } from '../../types.js'

export const DynamicFieldSelector: React.FC<
  { validate: SelectFieldValidation } & SelectFieldClientProps
> = (props) => {
  const { fields, getDataByPath } = useForm()

  const [options, setOptions] = useState<SelectFieldOption[]>([])

  useEffect(() => {
    const fields: any[] = getDataByPath('fields')

    if (fields) {
      const allNonPaymentFields = fields
        .map((block): null | SelectFieldOption => {
          const { name, blockType, label } = block

          if (blockType !== 'payment') {
            return {
              label,
              value: name,
            }
          }

          return null
        })
        .filter((field) => field !== null)
      setOptions(allNonPaymentFields)
    }
  }, [fields, getDataByPath])

  return (
    <SelectField
      {...props}
      field={{
        ...(props.field || {}),
        options,
      }}
    />
  )
}

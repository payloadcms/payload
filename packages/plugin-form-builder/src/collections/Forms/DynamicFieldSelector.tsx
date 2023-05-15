import React, { useEffect, useState } from 'react'
import { Select, useForm } from 'payload/components/forms'
import { TextField } from 'payload/dist/fields/config/types'

import { SelectFieldOption } from '../../types'

export const DynamicFieldSelector: React.FC<TextField> = props => {
  const { fields, getDataByPath } = useForm()

  const [options, setOptions] = useState<SelectFieldOption[]>([])

  useEffect(() => {
    // @ts-ignore
    const fields: any[] = getDataByPath('fields')

    if (fields) {
      const allNonPaymentFields = fields
        .map((block): SelectFieldOption | null => {
          const { name, label, blockType } = block

          if (blockType !== 'payment') {
            return {
              label,
              value: name,
            }
          }

          return null
        })
        .filter(Boolean) as SelectFieldOption[]
      setOptions(allNonPaymentFields)
    }
  }, [fields, getDataByPath])

  return <Select {...props} options={options} />
}

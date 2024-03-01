import type { FormState } from '@payloadcms/ui'
import type { Data } from 'payload/types'
import type React from 'react'

import { reduceFieldsToValues, useAllFormFields } from '@payloadcms/ui'
import { useEffect } from 'react'

type Props = {
  onChange?: ({
    fullFieldsWithValues,
    newFormData,
  }: {
    fullFieldsWithValues: FormState
    newFormData: Data
  }) => void
}

export const FormSavePlugin: React.FC<Props> = (props) => {
  const { onChange } = props

  const [fields, dispatchFields] = useAllFormFields()

  // Pass in fields, and indicate if you'd like to "unflatten" field data.
  // The result below will reflect the data stored in the form at the given time
  const newFormData = reduceFieldsToValues(fields, true)

  useEffect(() => {
    if (onChange) {
      onChange({ fullFieldsWithValues: fields, newFormData })
    }
  }, [newFormData, onChange, fields])

  return null
}

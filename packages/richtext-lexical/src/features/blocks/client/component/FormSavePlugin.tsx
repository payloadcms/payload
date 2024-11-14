'use client'
import type { Data, FormState } from 'payload'
import type React from 'react'

import { useAllFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useEffect } from 'react'

import { removeEmptyArrayValues } from './removeEmptyArrayValues.js'

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

  const [_fields] = useAllFormFields()

  const fields = removeEmptyArrayValues({ fields: _fields })

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

'use client'

import type { SelectFieldClient } from 'payload'

import { SelectField } from '../../../../fields/Select/index.js'
import { useFormFields } from '../../../../forms/Form/index.js'

export const ConstraintFieldClient = ({
  allowedConstraints,
  field,
  path,
}: {
  allowedConstraints: string[]
  field: SelectFieldClient
  path: string
}) => {
  const fieldState = useFormFields(([fields]) => fields[path])

  const readOnly = !allowedConstraints.includes(fieldState.value as string)

  return (
    <SelectField
      field={field}
      filterOption={(option) => {
        if (typeof option === 'string') {
          return allowedConstraints?.includes(option)
        }

        return allowedConstraints?.includes(option.value)
      }}
      path={path}
      readOnly={readOnly}
    />
  )
}

'use client'

import type { ClientFieldWithOptionalType } from 'payload'

import { SelectField } from '../../../../fields/Select/index.js'

export const ConstraintFieldClient = ({
  allowedConstraints,
  field,
  path,
}: {
  allowedConstraints: string[]
  field: ClientFieldWithOptionalType
  path: string
}) => {
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
    />
  )
}

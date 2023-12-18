import React from 'react'

import type {
  DescriptionComponent,
  DescriptionFunction,
} from '../../../../packages/payload/src/admin/components/forms/FieldDescription/types'

export const FieldDescriptionComponent: DescriptionComponent<string> = ({ path, value }) => {
  return (
    <div>
      Component description: {path} - {value}
    </div>
  )
}

export const FieldDescriptionFunction: DescriptionFunction<string> = ({ path, value }) => {
  return `Function description: ${path} - ${value}`
}

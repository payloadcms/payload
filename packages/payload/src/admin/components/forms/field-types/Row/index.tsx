import React from 'react'

import type { Props } from './types'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import withCondition from '../../withCondition'
import './index.scss'
import { RowProvider } from './provider'

const Row: React.FC<Props> = (props) => {
  const {
    admin: { className, readOnly },
    fieldTypes,
    fields,
    indexPath,
    path,
    permissions,
  } = props

  const classes = ['field-type', 'row', className].filter(Boolean).join(' ')

  return (
    <RowProvider>
      <RenderFields
        className={classes}
        fieldSchema={fields.map((field) => ({
          ...field,
          path: createNestedFieldPath(path, field),
        }))}
        fieldTypes={fieldTypes}
        indexPath={indexPath}
        permissions={permissions}
        readOnly={readOnly}
      />
    </RowProvider>
  )
}
export default withCondition(Row)

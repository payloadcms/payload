import React from 'react'

import type { Props } from './types.js'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath.js'
import RenderFields from '../../RenderFields/index.js'
import withCondition from '../../withCondition/index.js'
import './index.scss'
import { RowProvider } from './provider.js'

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
        fieldSchema={fields.map((field) => ({
          ...field,
          path: createNestedFieldPath(path, field),
        }))}
        className={classes}
        fieldTypes={fieldTypes}
        indexPath={indexPath}
        permissions={permissions}
        readOnly={readOnly}
      />
    </RowProvider>
  )
}
export default withCondition(Row)

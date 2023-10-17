import React from 'react'

import type { Props } from './types'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { RowProvider } from './provider'

const Row: React.FC<Props> = (props) => {
  const {
    admin: { className, readOnly },
    fieldTypes,
    fields,
    forceRender = false,
    indexPath,
    path,
    permissions,
  } = props

  return (
    <RowProvider>
      <RenderFields
        className={[fieldBaseClass, 'row', className].filter(Boolean).join(' ')}
        fieldSchema={fields.map((field) => ({
          ...field,
          path: createNestedFieldPath(path, field),
        }))}
        fieldTypes={fieldTypes}
        forceRender={forceRender}
        indexPath={indexPath}
        permissions={permissions}
        readOnly={readOnly}
      />
    </RowProvider>
  )
}
export default withCondition(Row)

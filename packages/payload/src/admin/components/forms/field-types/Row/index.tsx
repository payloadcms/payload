import React from 'react'

import type { Props } from './types'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import withCondition from '../../withCondition'
import './index.scss'
import { RowProvider } from './provider'
import { fieldBaseClass } from '../shared'

const Row: React.FC<Props> = (props) => {
  const {
    admin: { className, readOnly },
    fieldTypes,
    fields,
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
        indexPath={indexPath}
        margins={false}
        permissions={permissions}
        readOnly={readOnly}
      />
    </RowProvider>
  )
}
export default withCondition(Row)

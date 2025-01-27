import React from 'react'

import type { Props } from './types'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { RowProvider } from './provider'

const baseClass = 'row'

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
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          className={`${baseClass}__fields`}
          fieldSchema={fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          fieldTypes={fieldTypes}
          forceRender={forceRender}
          indexPath={indexPath}
          margins={false}
          permissions={permissions}
          readOnly={readOnly}
        />
      </div>
    </RowProvider>
  )
}
export default withCondition(Row)

import React from 'react'

import type { Props } from './types'

import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { fieldBaseClass } from '../shared'
import { RowProvider } from './provider'
import { withCondition } from '../../withCondition'

import './index.scss'

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
    formState,
    user,
    i18n,
    payload,
    config,
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
          formState={formState}
          user={user}
          i18n={i18n}
          payload={payload}
          config={config}
        />
      </div>
    </RowProvider>
  )
}

export default withCondition(Row)

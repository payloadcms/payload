'use client'
import type { RowFieldClientComponent } from 'payload'

import React from 'react'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { RowProvider } from './provider.js'

const baseClass = 'row'

const RowFieldComponent: RowFieldClientComponent = (props) => {
  const {
    field: { admin: { className, style } = {}, fields },
    forceRender = false,
    indexPath = '',
    parentPath = '',
    parentSchemaPath = '',
    permissions,
    readOnly,
  } = props

  return (
    <RowProvider>
      <div
        className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}
        style={style || undefined}
      >
        <RenderFields
          className={`${baseClass}__fields`}
          fields={fields}
          forceRender={forceRender}
          margins={false}
          parentIndexPath={indexPath}
          parentPath={parentPath}
          parentSchemaPath={parentSchemaPath}
          permissions={permissions}
          readOnly={readOnly}
        />
      </div>
    </RowProvider>
  )
}

export const RowField = withCondition(RowFieldComponent)

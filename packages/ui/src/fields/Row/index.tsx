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
    field: { admin: { className, readOnly } = {}, fields },
    forceRender = false,
  } = props

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          className={`${baseClass}__fields`}
          fields={fields}
          margins={false}
          parentPath={props.path?.split('.')}
        />
      </div>
    </RowProvider>
  )
}

export const RowField = withCondition(RowFieldComponent)

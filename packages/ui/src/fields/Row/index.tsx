'use client'
import type { RowFieldClientComponent } from 'payload'

import React from 'react'

import { RenderFieldMap, RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { RowProvider, useRow } from './provider.js'

export { RowProvider, useRow }

const baseClass = 'row'

const RowFieldComponent: RowFieldClientComponent = (props) => {
  const {
    field: { admin: { className, readOnly } = {}, fields },
    forceRender = false,
    path,
    renderedFieldMap,
    schemaPath,
  } = props

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields renderedFieldMap={renderedFieldMap} />
      </div>
    </RowProvider>
  )
}

export const RowField = withCondition(RowFieldComponent)

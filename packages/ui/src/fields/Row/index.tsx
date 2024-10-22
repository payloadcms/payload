'use client'
import type { RowFieldClientComponent } from 'payload'

import React from 'react'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'row'

const RowFieldComponent: RowFieldClientComponent = (props) => {
  const {
    field: { admin: { className, readOnly } = {}, fields },
    forceRender = false,
  } = props

  return (
    <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
      <RenderFields fields={fields} path={props.path} />
    </div>
  )
}

export const RowField = withCondition(RowFieldComponent)

'use client'
import type { RowFieldProps } from 'payload'

import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { RowProvider, useRow } from './provider.js'

export { RowProvider, useRow }

const baseClass = 'row'

const RowFieldComponent: React.FC<RowFieldProps> = (props) => {
  const {
    admin: { className },
    fields,
    forceRender = false,
  } = props

  const { indexPath, path, readOnly, schemaPath, siblingPermissions } = useFieldProps()

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          {...{ fields, forceRender, path, readOnly, schemaPath }}
          className={`${baseClass}__fields`}
          forceRender={forceRender}
          indexPath={indexPath}
          margins={false}
          permissions={siblingPermissions}
        />
      </div>
    </RowProvider>
  )
}

export const RowField = withCondition(RowFieldComponent)

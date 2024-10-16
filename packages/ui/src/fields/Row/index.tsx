'use client'
import type { RowFieldClientComponent } from 'payload'

import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { RowProvider, useRow } from './provider.js'

export { RowProvider, useRow }

const baseClass = 'row'

const RowFieldComponent: RowFieldClientComponent = (props) => {
  const {
    field: { admin: { className } = {}, fields },
    forceRender = false,
  } = props

  const { indexPath, path, readOnly, schemaPath, siblingPermissions } = useFieldProps()

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          className={`${baseClass}__fields`}
          fields={fields}
          forceRender={forceRender}
          indexPath={indexPath}
          margins={false}
          path={path}
          permissions={siblingPermissions}
          readOnly={readOnly}
          schemaPath={schemaPath}
        />
      </div>
    </RowProvider>
  )
}

export const RowField = withCondition(RowFieldComponent)

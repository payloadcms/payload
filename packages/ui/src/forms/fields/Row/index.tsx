'use client'
import React from 'react'

import type { Props } from './types.js'

import { useFieldProps } from '../../FieldPropsProvider/index.js'
import { RenderFields } from '../../RenderFields/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'
import { RowProvider } from './provider.js'

const baseClass = 'row'

const Row: React.FC<Props> = (props) => {
  const { className, fieldMap, forceRender = false } = props

  const { path, readOnly, schemaPath, siblingPermissions } = useFieldProps()

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          {...{ fieldMap, forceRender, path, readOnly, schemaPath }}
          className={`${baseClass}__fields`}
          fieldMap={fieldMap}
          forceRender={forceRender}
          margins={false}
          permissions={siblingPermissions}
        />
      </div>
    </RowProvider>
  )
}

export default withCondition(Row)

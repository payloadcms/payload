'use client'
import React from 'react'

import type { Props } from './types'

import RenderFields from '../../RenderFields'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { RowProvider } from './provider'

const baseClass = 'row'

const Row: React.FC<Props> = (props) => {
  const { className, fieldMap, forceRender = false, indexPath, permissions, readOnly } = props

  return (
    <RowProvider>
      <div className={[fieldBaseClass, baseClass, className].filter(Boolean).join(' ')}>
        <RenderFields
          className={`${baseClass}__fields`}
          fieldMap={fieldMap}
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

'use client'
import React from 'react'

import type { Props } from './types'

import RenderFields from '../../RenderFields'
import { fieldBaseClass } from '../shared'
import { RowProvider } from './provider'
import { withCondition } from '../../withCondition'

import './index.scss'

const baseClass = 'row'

const Row: React.FC<Props> = (props) => {
  const { className, readOnly, forceRender = false, indexPath, permissions, fieldMap } = props

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

'use client'
import React from 'react'

import type { RowLabelProps } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
export type { RowLabelProps }

const baseClass = 'row-label'

export const RowLabel: React.FC<RowLabelProps> = (props) => {
  const { className, CustomComponent, label } = props

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      Fallback={
        <span
          className={[baseClass, className].filter(Boolean).join(' ')}
          style={{
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      }
    />
  )
}

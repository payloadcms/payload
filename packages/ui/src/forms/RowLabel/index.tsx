'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { RowLabelProps } from './types.js'
export type { RowLabelProps }

import { RenderComponent } from '../../elements/RenderComponent/index.js'
import { RowLabelProvider } from '../RowLabel/Context/index.js'

const baseClass = 'row-label'

export const RowLabel: React.FC<RowLabelProps> = (props) => {
  const { className, i18n, path, RowLabel: RowLabelComponent, rowLabel, rowNumber } = props

  if (RowLabelComponent) {
    return (
      <RowLabelProvider path={path} rowNumber={rowNumber}>
        <RenderComponent clientProps={{ label: rowLabel }} mappedComponent={RowLabelComponent} />
      </RowLabelProvider>
    )
  }

  const label = rowLabel
    ? typeof rowLabel === 'object'
      ? getTranslation(rowLabel, i18n)
      : typeof rowLabel === 'string'
        ? rowLabel
        : ''
    : ''

  return (
    <span
      className={[baseClass, className].filter(Boolean).join(' ')}
      style={{
        pointerEvents: 'none',
      }}
    >
      {label}
    </span>
  )
}

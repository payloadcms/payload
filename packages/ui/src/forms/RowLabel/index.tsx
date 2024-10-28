'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { RowLabelProps } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
export type { RowLabelProps }

const baseClass = 'row-label'

export const RowLabel: React.FC<RowLabelProps> = (props) => {
  const { className, rowLabel } = props
  const { i18n } = useTranslation()
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

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Props } from './types.js'

import { RowLabelProvider } from '../RowLabel/Context/index.js'

const baseClass = 'row-label'

export const RowLabel: React.FC<Props> = (props) => {
  const { RowLabelComponent, className, i18n, path, rowLabel, rowNumber } = props

  if (RowLabelComponent) {
    return (
      <RowLabelProvider path={path} rowNumber={rowNumber}>
        {RowLabelComponent}
      </RowLabelProvider>
    )
  }

  const label = typeof rowLabel === 'object' ? getTranslation(rowLabel, i18n) : rowLabel

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

import type { LabelFunction, StaticLabel } from 'payload'

import './index.css'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import React from 'react'

import { FieldDiffLabel } from '../FieldDiffLabel/index.js'

const baseClass = 'field-diff'

const gutterOffset = 6.5

export const FieldDiffContainer: React.FC<{
  className?: string
  From: React.ReactNode
  i18n: I18nClient
  label: {
    label?: false | LabelFunction | StaticLabel
    locale?: string
  }
  nestingLevel?: number
  To: React.ReactNode
}> = (args) => {
  const {
    className,
    From,
    i18n,
    label: { label, locale },
    nestingLevel = 0,
    To,
  } = args

  return (
    <div
      className={`${baseClass}-container${className ? ` ${className}` : ''} nested-level-${nestingLevel}`}
    >
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {label !== false && typeof label !== 'function' && getTranslation(label || '', i18n)}
      </FieldDiffLabel>
      <div
        className={`${baseClass}-content`}
        style={
          nestingLevel
            ? ({
                '--field-diff-columns': `calc(50% - ${nestingLevel * gutterOffset}px - var(--spacer-2-5)) calc(50% + ${nestingLevel * gutterOffset}px - var(--spacer-2-5))`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {From}
        {To}
      </div>
    </div>
  )
}

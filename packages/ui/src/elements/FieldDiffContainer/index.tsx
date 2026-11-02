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

  const labelID = React.useId()
  const labelText = label !== false ? getTranslation(label || '', i18n) : ''
  const a11yID = locale || labelText ? labelID : undefined

  return (
    <div
      aria-labelledby={a11yID}
      className={`${baseClass}-container${className ? ` ${className}` : ''} nested-level-${nestingLevel}`}
      role={a11yID ? 'group' : undefined}
    >
      <FieldDiffLabel id={a11yID}>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {labelText}
      </FieldDiffLabel>
      <div
        className={`${baseClass}-content`}
        style={
          nestingLevel
            ? ({
                '--field-diff-columns': `calc(50% - ${nestingLevel * gutterOffset}px) calc(50% + ${nestingLevel * gutterOffset}px)`,
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

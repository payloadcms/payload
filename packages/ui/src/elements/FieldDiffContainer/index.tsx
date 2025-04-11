import type { LabelFunction, StaticLabel } from 'payload'

import './index.scss'

import { getTranslation, type I18nClient } from '@payloadcms/translations'

import { FieldDiffLabel } from '../FieldDiffLabel/index.js'

const baseClass = 'field-diff'

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
      className={`${baseClass}${className ? ` ${className}` : ''} nested-level-${nestingLevel}`}
      style={
        nestingLevel
          ? ({
              // Need to use % instead of fr, as calc() doesn't work with fr when this is used in gridTemplateColumns
              '--left-offset': `calc(50%  - (${nestingLevel} * calc( calc(var(--base)* 0.5) - 2px  )))`,
            } as React.CSSProperties)
          : ({
              '--left-offset': '50%',
            } as React.CSSProperties)
      }
    >
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {typeof label !== 'function' && getTranslation(label || '', i18n)}
      </FieldDiffLabel>
      <div
        className={`${baseClass}-container${className ? ` ${className}` : ''}`}
        style={
          nestingLevel
            ? {
                gridTemplateColumns: `calc(var(--left-offset) - 10px) calc(50% - 10px + calc(50% - var(--left-offset)))`,
              }
            : undefined
        }
      >
        {From}
        {To}
      </div>
    </div>
  )
}

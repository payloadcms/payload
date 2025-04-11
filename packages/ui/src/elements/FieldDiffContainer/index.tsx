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
  To: React.ReactNode
}> = (args) => {
  const {
    className,
    From,
    i18n,
    label: { label, locale },
    To,
  } = args

  return (
    <div className={`${baseClass}${className ? ` ${className}` : ''}`}>
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {typeof label !== 'function' && getTranslation(label || '', i18n)}
      </FieldDiffLabel>
      <div className={`${baseClass}-container${className ? ` ${className}` : ''}`}>
        {From}
        {To}
      </div>
    </div>
  )
}

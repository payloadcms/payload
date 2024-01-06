import React from 'react'
import { useTranslation } from '../../../providers/Translation'

import { Chevron } from '../../../icons/Chevron'
import { getTranslation } from 'payload/utilities'
import { useLocale } from '../../../providers/Locale'
import './index.scss'

const baseClass = 'localizer-button'

export const LocalizerLabel: React.FC<{
  ariaLabel?: string
  className?: string
}> = (props) => {
  const { ariaLabel, className } = props
  const locale = useLocale()
  const { t } = useTranslation()
  const { i18n } = useTranslation()

  return (
    <div
      aria-label={ariaLabel || t('general:locale')}
      className={[baseClass, className].filter(Boolean).join(' ')}
    >
      <div className={`${baseClass}__label`}>{`${t('general:locale')}:`}</div>
      &nbsp;&nbsp;
      <span className={`${baseClass}__current-label`}>{`${getTranslation(
        locale.label,
        i18n,
      )}`}</span>
      &nbsp;
      <Chevron className={`${baseClass}__chevron`} />
    </div>
  )
}

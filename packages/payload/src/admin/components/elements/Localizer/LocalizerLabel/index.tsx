import React from 'react'
import { Chevron } from '../../..'
import { useLocale } from '../../../utilities/Locale'
import { useTranslation } from 'react-i18next'

import './index.scss'

const baseClass = 'localizer-button'

export const LocalizerLabel: React.FC<{
  className?: string
  ariaLabel?: string
}> = (props) => {
  const { className, ariaLabel } = props
  const locale = useLocale()
  const { t } = useTranslation()

  return (
    <div
      className={[baseClass, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel || t('locale')}
    >
      <div className={`${baseClass}__label`}>{`${t('locale')}:`}</div>
      &nbsp;&nbsp;
      <span className={`${baseClass}__current-label`}>{`${locale.label}`}</span>
      &nbsp;
      <Chevron className={`${baseClass}__chevron`} />
    </div>
  )
}

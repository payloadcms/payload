import React from 'react'
import { useTranslation } from 'react-i18next'

import { Chevron } from '../../..'
import { getTranslation } from '../../../../../utilities/getTranslation'
import { useLocale } from '../../../utilities/Locale'
import './index.scss'

const baseClass = 'localizer-button'

export const LocalizerLabel: React.FC<{
  ariaLabel?: string
  className?: string
}> = (props) => {
  const { ariaLabel, className } = props
  const locale = useLocale()
  const { t } = useTranslation('general')
  const { i18n } = useTranslation()

  return (
    <div
      aria-label={ariaLabel || t('locale')}
      className={[baseClass, className].filter(Boolean).join(' ')}
    >
      <div className={`${baseClass}__label`}>{`${t('locale')}:`}</div>
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

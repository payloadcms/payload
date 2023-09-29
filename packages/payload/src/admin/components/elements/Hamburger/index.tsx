import React from 'react'

import './index.scss'
import { Chevron } from '../..'
import { useTranslation } from 'react-i18next'

const baseClass = 'hamburger'

export const Hamburger: React.FC<{
  isActive?: boolean
  closeIcon?: 'collapse' | 'x'
}> = (props) => {
  const { t } = useTranslation('general')
  const { isActive = false, closeIcon = 'x' } = props

  return (
    <div className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__icon`}>
        <div className={`${baseClass}__line ${baseClass}__top`} />
        <div className={`${baseClass}__line ${baseClass}__middle`} />
        <div className={`${baseClass}__line ${baseClass}__bottom`} />
      </div>
      {closeIcon === 'x' && (
        <div className={`${baseClass}__x`}>
          <div className={`${baseClass}__line ${baseClass}__x-left`} />
          <div className={`${baseClass}__line ${baseClass}__x-right`} />
        </div>
      )}
      {closeIcon === 'collapse' && (
        <div className={`${baseClass}__collapse`} aria-label={t('collapse')} title={t('collapse')}>
          <div className={`${baseClass}__line ${baseClass}__collapse-left`} />
          <Chevron className={`${baseClass}__collapse-chevron`} direction="left" />
          {/* <div className={`${baseClass}__collapse-label`}>{t('collapse')}</div> */}
        </div>
      )}
    </div>
  )
}

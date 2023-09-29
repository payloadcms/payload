import React, { Fragment } from 'react'

import { Chevron } from '../../..'
import { useTranslation } from 'react-i18next'

import './index.scss'

const baseClass = 'nav-icon'

export const NavIcon: React.FC<{
  isActive?: boolean
}> = (props) => {
  const { isActive = false } = props
  const { t } = useTranslation('general')

  return (
    <div className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__icon`}>
        <div className={`${baseClass}__hamburger`}>
          <div className={`${baseClass}__line ${baseClass}__top`} />
          <div className={`${baseClass}__line ${baseClass}__middle`} />
          <div className={`${baseClass}__line ${baseClass}__bottom`} />
        </div>
        <div className={`${baseClass}__x`}>
          <div className={`${baseClass}__line ${baseClass}__x-left`} />
          <div className={`${baseClass}__line ${baseClass}__x-right`} />
        </div>
        <Chevron className={`${baseClass}__chevron`} direction="left" size="large" />
      </div>
      <div className={`${baseClass}__close`}>{t('close')}</div>
    </div>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'

import { Chevron } from '../..'
import './index.scss'

const baseClass = 'hamburger'

export const Hamburger: React.FC<{
  closeIcon?: 'collapse' | 'x'
  isActive?: boolean
}> = (props) => {
  const { t } = useTranslation('general')
  const { closeIcon = 'x', isActive = false } = props

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__icon`}>
          {!isActive && (
            <div className={`${baseClass}__lines`} title={t('open')}>
              <div className={`${baseClass}__line ${baseClass}__top`} />
              <div className={`${baseClass}__line ${baseClass}__middle`} />
              <div className={`${baseClass}__line ${baseClass}__bottom`} />
            </div>
          )}
          {isActive && (
            <div
              aria-label={closeIcon === 'collapse' ? t('collapse') : t('close')}
              className={`${baseClass}__close-icon`}
              title={closeIcon === 'collapse' ? t('collapse') : t('close')}
            >
              {closeIcon === 'x' && (
                <React.Fragment>
                  <div className={`${baseClass}__line ${baseClass}__x-left`} />
                  <div className={`${baseClass}__line ${baseClass}__x-right`} />
                </React.Fragment>
              )}
              {closeIcon === 'collapse' && (
                <Chevron className={`${baseClass}__collapse-chevron`} direction="left" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

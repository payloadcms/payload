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
    <div className={[baseClass].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__icon`}>
        {!isActive && (
          <div className={`${baseClass}__lines`}>
            <div className={`${baseClass}__line ${baseClass}__top`} />
            <div className={`${baseClass}__line ${baseClass}__middle`} />
            <div className={`${baseClass}__line ${baseClass}__bottom`} />
          </div>
        )}

        {isActive && (
          <div className={`${baseClass}__close-icon`}>
            {closeIcon === 'x' && (
              <div>
                <div className={`${baseClass}__line ${baseClass}__x-left`} />
                <div className={`${baseClass}__line ${baseClass}__x-right`} />
              </div>
            )}

            {closeIcon === 'collapse' && (
              <Chevron className={`${baseClass}__collapse-chevron`} direction="left" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

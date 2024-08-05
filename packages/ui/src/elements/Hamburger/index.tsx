'use client'
import { CloseMenuIcon, MenuIcon } from '@payloadcms/ui'
import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'hamburger'

export const Hamburger: React.FC<{
  closeIcon?: 'collapse' | 'x'
  isActive?: boolean
}> = (props) => {
  const { t } = useTranslation()
  const { closeIcon = 'x', isActive = false } = props

  return (
    <div className={baseClass}>
      {!isActive && (
        <div
          aria-label={t('general:open')}
          className={`${baseClass}__open-icon`}
          title={t('general:open')}
        >
          <MenuIcon />
        </div>
      )}
      {isActive && (
        <div
          aria-label={closeIcon === 'collapse' ? t('general:collapse') : t('general:close')}
          className={`${baseClass}__close-icon`}
          title={closeIcon === 'collapse' ? t('general:collapse') : t('general:close')}
        >
          {closeIcon === 'x' && <CloseMenuIcon />}
          {closeIcon === 'collapse' && <ChevronIcon direction="left" />}
        </div>
      )}
    </div>
  )
}

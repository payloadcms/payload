'use client'
import React from 'react'

import { SpinnerIcon } from '../../icons/Spinner/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'spinner'

export type SpinnerProps = {
  /**
   * Custom text to show next to the spinner. Pass `null` to hide text entirely.
   * @default 'Loading...' (translated)
   */
  loadingText?: null | string
  /**
   * Size of the spinner
   * @default 'default'
   */
  size?: 'default' | 'small'
}

export const Spinner: React.FC<SpinnerProps> = ({ loadingText, size = 'default' }) => {
  const { t } = useTranslation()

  return (
    <div className={[baseClass, `${baseClass}--${size}`].filter(Boolean).join(' ')}>
      <SpinnerIcon size={size === 'small' ? 16 : 24} />

      {loadingText !== null && (
        <span className={`${baseClass}__text`}>{loadingText || `${t('general:loading')}...`}</span>
      )}
    </div>
  )
}

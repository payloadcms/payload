'use client'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'spinner'

export type SpinnerProps = {
  /**
   * Custom text to show next to the spinner. Pass `null` to hide text entirely.
   * @default 'Loading...' (translated)
   */
  loadingText?: null | string
}

export const Spinner: React.FC<SpinnerProps> = ({ loadingText }) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__circle`} />

      {loadingText !== null && (
        <span className={`${baseClass}__text`}>{loadingText || `${t('general:loading')}...`}</span>
      )}
    </div>
  )
}

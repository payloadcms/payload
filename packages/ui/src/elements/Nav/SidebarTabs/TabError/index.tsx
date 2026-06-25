'use client'

import React from 'react'

import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'sidebar-tab-error'

export type TabErrorProps = {
  message: string
  onRetry: () => void
}

export const TabError: React.FC<TabErrorProps> = ({ message, onRetry }) => {
  const { t } = useTranslation()
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <span>{message}</span>
        <button className={`${baseClass}__retry`} onClick={onRetry} type="button">
          {t('general:retry')}
        </button>
      </div>
    </div>
  )
}

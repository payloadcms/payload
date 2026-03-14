'use client'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

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

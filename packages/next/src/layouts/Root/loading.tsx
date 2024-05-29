import type { TFunction } from '@payloadcms/translations'

import React from 'react'

import './loading.scss'

export const Loading: React.FC<{
  Icon: React.ReactNode
  t: TFunction
}> = ({ Icon, t }) => {
  return (
    <div className="loading">
      <div className="loading__icon">{Icon}</div>
      <p className="loading__text">
        <strong>
          {t('general:loading')}
          <span className="loading__ellipsis">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </strong>
      </p>
    </div>
  )
}

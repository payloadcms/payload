'use client'
import type { I18nClient } from '@payloadcms/translations'

import React from 'react'

import './index.scss'

const baseClass = 'error-pill'

export type ErrorPillProps = {
  className?: string
  count: number
  i18n: I18nClient
  withMessage?: boolean
}

export const ErrorPill: React.FC<ErrorPillProps> = (props) => {
  const { className, count, i18n, withMessage } = props
  const lessThan3Chars = !withMessage && count < 99

  const classes = [baseClass, lessThan3Chars && `${baseClass}--fixed-width`, className && className]
    .filter(Boolean)
    .join(' ')

  if (count === 0) {
    return null
  }

  return (
    <div className={classes}>
      <div className={`${baseClass}__content`}>
        <span className={`${baseClass}__count`}>{count}</span>
        {withMessage && ` ${count > 1 ? i18n.t('general:errors') : i18n.t('general:error')}`}
      </div>
    </div>
  )
}

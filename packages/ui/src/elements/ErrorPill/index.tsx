import React from 'react'

import type { Props } from './types'

import './index.scss'

const baseClass = 'error-pill'

export const ErrorPill: React.FC<Props> = (props) => {
  const { className, count, withMessage, i18n } = props
  const lessThan3Chars = !withMessage && count < 99

  const classes = [baseClass, lessThan3Chars && `${baseClass}--fixed-width`, className && className]
    .filter(Boolean)
    .join(' ')

  if (count === 0) return null

  return (
    <div className={classes}>
      <div className={`${baseClass}__content`}>
        <span className={`${baseClass}__count`}>{count}</span>
        {withMessage && ` ${count > 1 ? i18n.t('general:errors') : i18n.t('general:error')}`}
      </div>
    </div>
  )
}

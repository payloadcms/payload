import React from 'react'

import type { Props } from './types.js'

import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'card'

export const Card: React.FC<Props> = (props) => {
  const { id, Link, actions, buttonAriaLabel, href, onClick, title, titleAs } = props

  const classes = [baseClass, id, (onClick || href) && `${baseClass}--has-onclick`]
    .filter(Boolean)
    .join(' ')

  const Tag = titleAs ?? 'div'

  return (
    <div className={classes} id={id}>
      <Tag className={`${baseClass}__title`}>{title}</Tag>
      {actions && <div className={`${baseClass}__actions`}>{actions}</div>}
      {(onClick || href) && (
        <Button
          Link={Link}
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className={`${baseClass}__click`}
          el="link"
          onClick={onClick}
          to={href}
        />
      )}
    </div>
  )
}

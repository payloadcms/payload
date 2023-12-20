import React from 'react'

import type { Props } from './types'

import { Button } from '../Button'
import './index.scss'

const baseClass = 'card'

export const Card: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, onClick, title, titleAs, Link, href } = props

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
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className={`${baseClass}__click`}
          onClick={onClick}
          Link={Link}
          el="link"
          to={href}
        />
      )}
    </div>
  )
}

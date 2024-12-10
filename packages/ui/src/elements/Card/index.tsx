'use client'
import type { ElementType } from 'react'

import React from 'react'

import { Button } from '../Button/index.js'
import './index.scss'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  Link?: ElementType
  onClick?: () => void
  title: string
  titleAs?: ElementType
}

const baseClass = 'card'

export const Card: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, Link, onClick, title, titleAs } = props

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
          el="link"
          Link={Link}
          onClick={onClick}
          to={href}
        />
      )}
    </div>
  )
}

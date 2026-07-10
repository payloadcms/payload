'use client'

import React from 'react'

import { Button } from '../Button/index.js'
import './index.css'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  onClick?: () => void
  title: string
  titleAs?: React.ElementType
}

const baseClass = 'card'

export const Card: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs } = props

  const classes = [baseClass, id, (onClick || href) && `${baseClass}--has-onclick`]
    .filter(Boolean)
    .join(' ')

  const Tag = titleAs ?? 'div'

  return (
    <div className={classes} id={id}>
      <Tag className={`${baseClass}__title`}>{title}</Tag>
      {(onClick || href) && (
        <Button
          aria-label={buttonAriaLabel}
          buttonStyle="ghost"
          className={`${baseClass}__click`}
          el="link"
          onClick={onClick}
          to={href}
        />
      )}
      {actions ? <div className={`${baseClass}__actions`}>{actions}</div> : null}
    </div>
  )
}

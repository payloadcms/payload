'use client'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.css'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: Record<string, string> | string
  href?: string
  id?: string
  onClick?: () => void
  title: Record<string, string> | string
  titleAs?: React.ElementType
}

const baseClass = 'card'

export const Card: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs } = props
  const { i18n } = useTranslation()

  const classes = [baseClass, id, (onClick || href) && `${baseClass}--has-onclick`]
    .filter(Boolean)
    .join(' ')

  const Tag = titleAs ?? 'div'

  return (
    <div className={classes} id={id}>
      <Tag className={`${baseClass}__title`}>{getTranslation(title as any, i18n)}</Tag>
      {(onClick || href) && (
        <Button
          aria-label={buttonAriaLabel ? getTranslation(buttonAriaLabel as any, i18n) : undefined}
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

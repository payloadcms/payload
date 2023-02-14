import React, { ElementType } from 'react'
import Link from 'next/link'

import classes from './index.module.scss'

export type Props = {
  label: string
  appearance?: 'default' | 'primary' | 'secondary'
  el?: 'button' | 'link' | 'a'
  onClick?: () => void
  href?: string
  newTab?: boolean
  className?: string
  type?: 'submit' | 'button'
  disabled?: boolean
}

export const Button: React.FC<Props> = ({
  el: elFromProps = 'link',
  label,
  newTab,
  href,
  appearance,
  className: classNameFromProps,
  onClick,
  type = 'button',
  disabled,
}) => {
  let el = elFromProps
  const newTabProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const className = [
    classes.button,
    classNameFromProps,
    classes[`appearance--${appearance}`],
    classes.button,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <div className={classes.content}>
      {/* <Chevron /> */}
      <span className={classes.label}>{label}</span>
    </div>
  )

  if (onClick || type === 'submit') el = 'button'

  if (el === 'link') {
    return (
      <Link href={href} className={className} {...newTabProps} onClick={onClick}>
        {content}
      </Link>
    )
  }

  const Element: ElementType = el

  return (
    <Element
      href={href}
      className={className}
      type={type}
      {...newTabProps}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </Element>
  )
}

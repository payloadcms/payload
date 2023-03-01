import React from 'react'
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
}

const elements = {
  a: 'a',
  link: Link,
  button: 'button',
}

export const Button: React.FC<Props> = ({
  el = 'button',
  label,
  newTab,
  href,
  appearance,
  className: classNameFromProps,
}) => {
  const Element = elements[el]
  const className = [classNameFromProps, classes[`appearance--${appearance}`], classes.button]
    .filter(Boolean)
    .join(' ')

  return (
    <Element
      href={href}
      className={className}
      {...(newTab
        ? {
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
    >
      {label}
    </Element>
  )
}

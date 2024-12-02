import type { ElementType } from 'react'

import Link from 'next/link'
import React from 'react'

import classes from './index.module.scss'

export type Props = {
  appearance?: 'default' | 'primary' | 'secondary'
  className?: string
  el?: 'a' | 'button' | 'link'
  form?: string
  href?: string
  label?: string
  newTab?: boolean | null
  onClick?: () => void
}

const elements = {
  a: 'a',
  button: 'button',
  link: Link,
}

export const Button: React.FC<Props> = ({
  appearance,
  className: classNameFromProps,
  el = 'button',
  form,
  href,
  label,
  newTab,
}) => {
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}
  const Element: ElementType = el
  const className = [classNameFromProps, classes[`appearance--${appearance}`], classes.button]
    .filter(Boolean)
    .join(' ')

  const elementProps = {
    ...newTabProps,
    className,
    form,
    href,
  }

  const content = (
    <div className={classes.content}>
      <span className={classes.label}>{label}</span>
    </div>
  )

  return (
    <Element {...elementProps}>
      <React.Fragment>
        {el === 'link' && (
          <Link {...newTabProps} className={elementProps.className} href={href || ''}>
            {content}
          </Link>
        )}
        {el !== 'link' && <React.Fragment>{content}</React.Fragment>}
      </React.Fragment>
    </Element>
  )
}

import type { Ref } from 'react'

import React, { forwardRef } from 'react'

import classes from './index.module.scss'

type Props = {
  children: React.ReactNode
  className?: string
  left?: boolean
  ref?: Ref<HTMLDivElement>
  right?: boolean
}

export const Gutter: React.FC<Props> = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { children, className, left = true, right = true } = props

  return (
    <div
      className={[
        classes.gutter,
        left && classes.gutterLeft,
        right && classes.gutterRight,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={ref}
    >
      {children}
    </div>
  )
})

Gutter.displayName = 'Gutter'

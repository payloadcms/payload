import type { Ref } from 'react'

import React from 'react'

import classes from './index.module.scss'

type Props = {
  children: React.ReactNode
  className?: string
  left?: boolean
  ref?: Ref<HTMLDivElement>
  right?: boolean
}

export const Gutter: React.FC<{ ref?: Ref<HTMLDivElement> } & Props> = (props) => {
  const { children, className, left = true, ref, right = true } = props

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
}

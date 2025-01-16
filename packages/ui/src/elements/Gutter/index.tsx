'use client'
import React from 'react'

import './index.scss'

export type GutterProps = {
  children: React.ReactNode
  className?: string
  left?: boolean
  negativeLeft?: boolean
  negativeRight?: boolean
  ref?: React.RefObject<HTMLDivElement>
  right?: boolean
}

const baseClass = 'gutter'

export const Gutter: React.FC<GutterProps> = (props) => {
  const {
    children,
    className,
    left = true,
    negativeLeft = false,
    negativeRight = false,
    ref,
    right = true,
  } = props

  const shouldPadLeft = left && !negativeLeft
  const shouldPadRight = right && !negativeRight

  return (
    <div
      className={[
        shouldPadLeft && `${baseClass}--left`,
        shouldPadRight && `${baseClass}--right`,
        negativeLeft && `${baseClass}--negative-left`,
        negativeRight && `${baseClass}--negative-right`,
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

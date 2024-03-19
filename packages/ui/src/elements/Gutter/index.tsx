import type { Ref } from 'react'

import React, { forwardRef } from 'react'

import './index.scss'

export type GutterProps = {
  children: React.ReactNode
  className?: string
  left?: boolean
  negativeLeft?: boolean
  negativeRight?: boolean
  ref?: Ref<HTMLDivElement>
  right?: boolean
}

const baseClass = 'gutter'

export const Gutter: React.FC<GutterProps> = forwardRef<HTMLDivElement, GutterProps>(
  (props, ref) => {
    const {
      children,
      className,
      left = true,
      negativeLeft = false,
      negativeRight = false,
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
  },
)

Gutter.displayName = 'Gutter'

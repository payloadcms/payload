import React from 'react'

import classes from './index.module.scss'

export type VerticalPaddingOptions = 'large' | 'medium' | 'none' | 'small'

type Props = {
  bottom?: VerticalPaddingOptions
  children: React.ReactNode
  className?: string
  top?: VerticalPaddingOptions
}

export const VerticalPadding: React.FC<Props> = ({
  bottom = 'medium',
  children,
  className,
  top = 'medium',
}) => {
  return (
    <div
      className={[className, classes[`top-${top}`], classes[`bottom-${bottom}`]]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

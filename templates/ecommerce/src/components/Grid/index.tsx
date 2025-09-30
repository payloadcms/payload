import clsx from 'clsx'
import React from 'react'

export function Grid(props: React.ComponentProps<'div'>) {
  const { children, className } = props
  return (
    <div {...props} className={clsx('grid grid-flow-row gap-4', className)}>
      {children}
    </div>
  )
}

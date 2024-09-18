import clsx from 'clsx'
import React from 'react'

export function Grid(props: React.ComponentProps<'ul'>) {
  const { children, className } = props
  return (
    <ul {...props} className={clsx('grid grid-flow-row gap-4', className)}>
      {children}
    </ul>
  )
}

function GridItem(props: React.ComponentProps<'li'>) {
  const { children, className } = props
  return (
    <li {...props} className={clsx('aspect-square transition-opacity', className)}>
      {children}
    </li>
  )
}

Grid.Item = GridItem

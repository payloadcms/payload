import type { Ref } from 'react'

import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  left?: boolean
  ref?: Ref<HTMLDivElement>
  right?: boolean
}

export const Gutter: React.FC<Props> = (props) => {
  const { children, className, left = true, ref, right = true } = props

  return <div ref={ref}>{children}</div>
}

Gutter.displayName = 'Gutter'

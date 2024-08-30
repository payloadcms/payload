import React from 'react'

import './index.scss'

const baseClass = 'list-header'

type Props = {
  children?: React.ReactNode
  className?: string
  heading: string
}
export function ListHeader({ children, className, heading }: Props) {
  return (
    <header className={[baseClass, className].filter(Boolean).join(' ')}>
      <h1>{heading}</h1>
      {children}
    </header>
  )
}

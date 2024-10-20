import React from 'react'

import classes from './index.module.scss'

type BackgroundColorProps = {
  invert?: boolean | null
  className?: string
  children?: React.ReactNode
  id?: string
}

export const BackgroundColor = (props: BackgroundColorProps) => {
  const { id, className, children, invert } = props

  return (
    <div id={id} className={[invert && classes.invert, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

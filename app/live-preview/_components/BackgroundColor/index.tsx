import React from 'react'

import classes from './index.module.scss'

type Props = {
  children?: React.ReactNode
  className?: string
  id?: string
  invert?: boolean | null
}

export const BackgroundColor: React.FC<Props> = (props) => {
  const { id, children, className, invert } = props

  return (
    <div className={[invert && classes.invert, className].filter(Boolean).join(' ')} id={id}>
      {children}
    </div>
  )
}

import * as React from 'react'

import classes from './index.module.scss'

export const Width: React.FC<{
  children: React.ReactNode
  width?: string
}> = ({ children, width }) => {
  return (
    <div className={classes.width} style={{ width: width ? `${width}%` : undefined }}>
      {children}
    </div>
  )
}

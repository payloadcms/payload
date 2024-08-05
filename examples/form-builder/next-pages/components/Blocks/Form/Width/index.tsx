import * as React from 'react'
import classes from './index.module.scss'

export const Width = ({ width, children }: { width?: string; children: React.ReactNode }) => {
  return (
    <div className={classes.width} style={{ width: width ? `${width}%` : undefined }}>
      {children}
    </div>
  )
}

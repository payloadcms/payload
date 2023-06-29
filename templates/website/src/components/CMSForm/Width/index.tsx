'use client'

import * as React from 'react'

import classes from './index.module.scss'

export const Width: React.FC<{
  width?: number
  children: React.ReactNode
}> = ({ width, children }) => {
  return (
    <div className={classes.width} style={{ width: width ? `${width}%` : undefined }}>
      {children}
    </div>
  )
}

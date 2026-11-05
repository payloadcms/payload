'use client'
import React from 'react'

const baseClass = 'dialog'

export type DialogBodyProps = {
  readonly children?: React.ReactNode
}

export const DialogBody: React.FC<DialogBodyProps> = ({ children }) => {
  return <div className={`${baseClass}__body`}>{children}</div>
}

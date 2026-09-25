'use client'
import React from 'react'

const baseClass = 'dialog'

export type DialogFooterProps = {
  readonly children?: React.ReactNode
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children }) => {
  if (!children) {
    return null
  }

  return <div className={`${baseClass}__footer`}>{children}</div>
}

'use client'
import React from 'react'
import { fieldBaseClass } from '../../shared'
import useField from '../../../useField'

import './index.scss'

export const TextInputWrapper: React.FC<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  width?: string
  path?: string
  readOnly?: boolean
}> = ({ children, className, style, width, path, readOnly }) => {
  const { valid } = useField({ path })

  return (
    <div
      className={[fieldBaseClass, 'text', className, !valid && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {children}
    </div>
  )
}

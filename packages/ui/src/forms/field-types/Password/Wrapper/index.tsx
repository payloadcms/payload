'use client'
import React from 'react'

import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'

export const PasswordInputWrapper: React.FC<{
  className?: string
  width?: string
  style?: React.CSSProperties
  children: React.ReactNode
  path: string
}> = (props) => {
  const { className, style, width, children, path } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[fieldBaseClass, 'password', className, !valid && 'error']
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

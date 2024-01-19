'use client'
import React from 'react'

import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'

export const TextareaInputWrapper: React.FC<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  width?: string
  path?: string
  readOnly?: boolean
}> = (props) => {
  const { children, className, style, width, path, readOnly } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[fieldBaseClass, 'textarea', className, !valid && 'error', readOnly && 'read-only']
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

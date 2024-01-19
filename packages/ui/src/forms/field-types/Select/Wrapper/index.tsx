'use client'
import React from 'react'

import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'

export const SelectFieldWrapper: React.FC<{
  className?: string
  width?: string
  style?: React.CSSProperties
  readOnly?: boolean
  children: React.ReactNode
  path: string
}> = (props) => {
  const { className, readOnly, style, width, children, path } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[fieldBaseClass, 'select', className, !valid && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      {children}
    </div>
  )
}

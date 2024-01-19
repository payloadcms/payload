'use client'
import React from 'react'
import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'

export const NumberInputWrapper: React.FC<{
  className?: string
  width?: string
  style?: React.CSSProperties
  readOnly?: boolean
  hasMany?: boolean
  children: React.ReactNode
  path: string
}> = (props) => {
  const { className, readOnly, hasMany, style, width, children, path } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[
        fieldBaseClass,
        'number',
        className,
        !valid && 'error',
        readOnly && 'read-only',
        hasMany && 'has-many',
      ]
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

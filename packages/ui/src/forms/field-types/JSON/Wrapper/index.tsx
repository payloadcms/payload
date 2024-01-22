'use client'
import React from 'react'
import { useFormFields } from '../../../Form/context'
import { fieldBaseClass } from '../../shared'

import './index.scss'

const baseClass = 'json-field'

export const JSONInputWrapper: React.FC<{
  className?: string
  width?: string
  style?: React.CSSProperties
  readOnly?: boolean
  hasMany?: boolean
  children: React.ReactNode
  path: string
}> = (props) => {
  const { width, className, style, path, children, readOnly } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[fieldBaseClass, baseClass, className, !valid && 'error', readOnly && 'read-only']
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

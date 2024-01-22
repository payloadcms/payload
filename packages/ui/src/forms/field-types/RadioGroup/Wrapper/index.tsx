'use client'
import React from 'react'

import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'
import { RadioField } from 'payload/types'

import './index.scss'

export const RadioGroupWrapper: React.FC<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  width?: string
  path?: string
  readOnly?: boolean
  baseClass?: string
  layout?: RadioField['admin']['layout']
}> = (props) => {
  const { children, className, style, width, path, readOnly, baseClass, layout } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        !valid && 'error',
        readOnly && `${baseClass}--read-only`,
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

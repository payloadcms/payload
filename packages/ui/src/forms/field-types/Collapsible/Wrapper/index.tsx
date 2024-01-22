'use client'
import React from 'react'

import { fieldBaseClass } from '../../shared'
import { useFormFields } from '../../../Form/context'

const baseClass = 'collapsible-field'

export const CollapsibleFieldWrapper: React.FC<{
  className?: string
  path: string
  children: React.ReactNode
  id?: string
}> = (props) => {
  const { children, className, path, id } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid } = field || {}

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        !valid ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      {children}
    </div>
  )
}

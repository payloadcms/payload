'use client'

import type React from 'react'

import { useFormFields } from '../Form/context.js'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  indexPath: string
  path: string
}> = (props) => {
  const { children, path } = props

  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { passesCondition } = field || {}

  if (passesCondition === true) {
    return children
  }

  return null
}

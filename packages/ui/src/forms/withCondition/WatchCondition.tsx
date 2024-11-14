'use client'

import React, { Fragment } from 'react'

import { useFormFields } from '../Form/context.js'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  indexPath: string
  path: string
}> = (props) => {
  const { children, path } = props

  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { passesCondition } = field || {}

  if (passesCondition === false) {
    return null
  }

  return <Fragment>{children}</Fragment>
}

'use client'
import type { FieldTypes } from 'payload'

import React, { Fragment } from 'react'

import { useFormFields } from '../Form/context.js'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  indexPath: string
  name?: string
  path?: string
  type: FieldTypes
}> = (props) => {
  const { name, children, path: pathFromProps } = props

  const path = typeof pathFromProps === 'string' ? pathFromProps : name

  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { passesCondition } = field || {}

  if (passesCondition === false) {
    return null
  }

  return <Fragment>{children}</Fragment>
}

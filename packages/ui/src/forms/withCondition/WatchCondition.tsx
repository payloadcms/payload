'use client'
import React from 'react'
import { Fragment } from 'react'

import { useFormFields } from '../Form/context'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  name?: string
  path?: string
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

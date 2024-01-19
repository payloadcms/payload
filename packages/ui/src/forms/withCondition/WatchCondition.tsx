'use client'
import React from 'react'

import { Fragment } from 'react'

import { useFormFields } from '../Form/context'

export const WatchCondition: React.FC<{
  name?: string
  path?: string
  children: React.ReactNode
}> = (props) => {
  const { name, path: pathFromProps, children } = props

  const path = typeof pathFromProps === 'string' ? pathFromProps : name

  const field = useFormFields(([fields]) => fields[path])

  const { passesCondition } = field || {}

  if (passesCondition === false) {
    return null
  }

  return <Fragment>{children}</Fragment>
}

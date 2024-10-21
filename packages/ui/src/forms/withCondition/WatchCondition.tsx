'use client'
import type { FieldTypes } from 'payload'

import { generateFieldKey } from 'payload/shared'
import React, { Fragment } from 'react'

import { useFormFields } from '../Form/context.js'

export const WatchCondition: React.FC<{
  children: React.ReactNode
  indexPath: string
  name?: string
  path?: string
  type: FieldTypes
}> = (props) => {
  const { name, type, children, indexPath, path: pathFromProps } = props

  const path = typeof pathFromProps === 'string' ? pathFromProps : name

  let formStateID = path

  if (['collapsible', 'row'].includes(type)) {
    formStateID = generateFieldKey({
      path: `${path ? `${path}.` : ''}`,
      schemaIndex: indexPath,
    })
  }

  const field = useFormFields(([fields]) => (fields && fields?.[formStateID]) || null)

  const { passesCondition } = field || {}

  if (passesCondition === false) {
    return null
  }

  return <Fragment>{children}</Fragment>
}

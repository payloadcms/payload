'use client'
import type { ClientFieldProps } from 'payload'

import React from 'react'

import { WatchCondition } from './WatchCondition.js'

export const withCondition = <P extends ClientFieldProps>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const {
      field: { type, _indexPath },
    } = props

    const name = 'name' in props.field ? props.field.name : undefined

    const path = ('path' in props ? props.path : undefined) ?? name

    return (
      <WatchCondition indexPath={_indexPath} name={name} path={path} type={type}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
